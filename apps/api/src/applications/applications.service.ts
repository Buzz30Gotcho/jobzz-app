import { Injectable, NotFoundException } from '@nestjs/common';
import type { Application, FollowUp, Prisma } from '@prisma/client';
import {
  type ApplicationFilter,
  type CreateFromOfferInput,
  type DashboardSummary,
  type FreeSendInput,
  type PublicApplication,
  type PublicFollowUp,
  type RecordFollowUpInput,
  type ResponseType,
} from '@jobzz/shared';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeKey } from '../common/normalize';
import { EntitlementsService, type EntitlementSubject } from '../entitlements/entitlements.service';
import { UsersService } from '../users/users.service';
import { AiMessagesService, type GeneratedMessage } from '../ai/ai-messages.service';
import { computeNextFollowUpAt } from '../followups/follow-up-rule';

const DAY_MS = 24 * 60 * 60 * 1000;

type ApplicationWithFollowUps = Application & { followUps: FollowUp[] };

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    private readonly users: UsersService,
    private readonly aiMessages: AiMessagesService,
  ) {}

  /** Rédige un message de relance (IA si Premium et disponible, sinon modèle) pour une candidature. */
  async aiMessage(subject: EntitlementSubject, applicationId: string): Promise<GeneratedMessage> {
    const application = await this.requireOwned(subject.id, applicationId);
    const kind = !application.contactEmail
      ? 'linkedin'
      : application.followUpCount > 0
        ? 'relance_encore'
        : 'relance';
    return this.aiMessages.generate(subject, {
      kind,
      entreprise: application.companyName,
      poste: application.position,
      dateCandidature: application.appliedAt.toLocaleDateString('fr-FR'),
    });
  }

  /** Liste « Mes candidatures » filtrée (recherche par entreprise, filtre par statut). */
  async list(userId: string, filter: ApplicationFilter, search?: string): Promise<PublicApplication[]> {
    const where: Prisma.ApplicationWhereInput = { userId };

    switch (filter) {
      case 'en_attente':
        where.status = 'en_attente';
        where.archivedAt = null;
        break;
      case 'relancee':
        where.status = 'relancee';
        where.archivedAt = null;
        break;
      case 'reponse_recue':
        where.status = 'reponse_recue';
        break;
      case 'archivees':
        where.archivedAt = { not: null };
        break;
      case 'toutes':
      default:
        break;
    }

    if (search && search.length > 0) {
      where.companyName = { contains: search, mode: 'insensitive' };
    }

    const rows = await this.prisma.application.findMany({
      where,
      include: { followUps: { orderBy: { sentAt: 'desc' } } },
      orderBy: { appliedAt: 'desc' },
    });
    return rows.map(toPublicApplication);
  }

  /** Onglet « À buzzer » : candidatures à relancer aujourd'hui, les plus en retard d'abord. */
  async due(userId: string): Promise<PublicApplication[]> {
    const rows = await this.prisma.application.findMany({
      where: {
        userId,
        status: 'en_attente',
        archivedAt: null,
        nextFollowUpAt: { lte: new Date() },
      },
      include: { followUps: { orderBy: { sentAt: 'desc' } } },
      orderBy: { nextFollowUpAt: 'asc' },
    });
    return rows.map(toPublicApplication);
  }

  /** « J'ai postulé » sur une offre. Signale un doublon plutôt que d'en créer un second. */
  async createFromOffer(
    userId: string,
    input: CreateFromOfferInput,
  ): Promise<{ application: PublicApplication; duplicate: boolean }> {
    const companyKey = normalizeKey(input.companyName);
    const positionKey = normalizeKey(input.position);

    const existing = await this.prisma.application.findFirst({
      where: { userId, companyKey, positionKey, archivedAt: null },
      include: { followUps: { orderBy: { sentAt: 'desc' } } },
    });
    if (existing) {
      return { application: toPublicApplication(existing), duplicate: true };
    }

    const appliedAt = input.appliedAt ? new Date(`${input.appliedAt}T00:00:00.000Z`) : new Date();
    const created = await this.prisma.application.create({
      data: {
        userId,
        companyName: input.companyName,
        companyKey,
        position: input.position,
        positionKey,
        contactEmail: input.contactEmail ?? null,
        appliedAt,
        source: 'offer',
        offerId: input.offerId ?? null,
        offerUrl: input.offerUrl ?? null,
        nextFollowUpAt: computeNextFollowUpAt(appliedAt),
      },
      include: { followUps: true },
    });
    return { application: toPublicApplication(created), duplicate: false };
  }

  /** « Écrire à une entreprise » : candidature spontanée, ou remerciement après entretien. */
  async freeSend(subject: EntitlementSubject, input: FreeSendInput): Promise<PublicApplication> {
    // L'envoi libre est limité en gratuit (5 / semaine) — passe par le module entitlements.
    await this.entitlements.consume('free_send', subject);
    const userId = subject.id;

    let application: ApplicationWithFollowUps;

    if (input.type === 'remerciement' && input.applicationId) {
      application = await this.requireOwned(userId, input.applicationId);
    } else {
      const companyKey = normalizeKey(input.companyName);
      const positionKey = normalizeKey(input.position ?? 'candidature spontanee');
      const appliedAt = new Date();
      application = await this.prisma.application.create({
        data: {
          userId,
          companyName: input.companyName,
          companyKey,
          position: input.position ?? 'Candidature spontanée',
          positionKey,
          contactEmail: input.contactEmail,
          appliedAt,
          source: 'free_send',
          nextFollowUpAt: computeNextFollowUpAt(appliedAt),
        },
        include: { followUps: true },
      });
    }

    await this.prisma.followUp.create({
      data: {
        applicationId: application.id,
        kind: input.type,
        channel: input.channel,
        subject: input.subject || null,
        body: input.body,
      },
    });

    return this.reload(application.id);
  }

  /**
   * Enregistre une relance effectuée (confirmation « C'est envoyé ? »). La candidature passe en
   * `relancee` et sort de « À buzzer » ; les relances « encore » restent possibles à la demande.
   */
  async recordFollowUp(
    userId: string,
    applicationId: string,
    input: RecordFollowUpInput,
  ): Promise<PublicApplication> {
    const application = await this.requireOwned(userId, applicationId);

    await this.prisma.followUp.create({
      data: {
        applicationId: application.id,
        kind: input.kind,
        channel: input.channel,
        subject: input.subject ?? null,
        body: input.body,
        aiGenerated: input.aiGenerated,
      },
    });

    // Une vraie relance fait passer en `relancee` et sort des buzz du jour.
    const isFollowUp = input.kind === 'relance' || input.kind === 'relance_encore' || input.kind === 'linkedin';
    if (isFollowUp && application.status === 'en_attente') {
      await this.prisma.application.update({
        where: { id: application.id },
        data: {
          status: 'relancee',
          lastFollowUpAt: new Date(),
          followUpCount: { increment: 1 },
          nextFollowUpAt: null,
        },
      });
    } else if (isFollowUp) {
      await this.prisma.application.update({
        where: { id: application.id },
        data: { lastFollowUpAt: new Date(), followUpCount: { increment: 1 } },
      });
    }

    return this.reload(application.id);
  }

  /** « L'entreprise a répondu » : entretien / refus / autre. Sort des relances. */
  async respond(userId: string, applicationId: string, responseType: ResponseType): Promise<PublicApplication> {
    await this.requireOwned(userId, applicationId);
    await this.prisma.application.update({
      where: { id: applicationId },
      data: { status: 'reponse_recue', responseType, respondedAt: new Date(), nextFollowUpAt: null },
    });
    return this.reload(applicationId);
  }

  /** Archive une candidature (elle sort de « À buzzer »). */
  async archive(userId: string, applicationId: string): Promise<PublicApplication> {
    await this.requireOwned(userId, applicationId);
    await this.prisma.application.update({
      where: { id: applicationId },
      data: { archivedAt: new Date(), nextFollowUpAt: null },
    });
    return this.reload(applicationId);
  }

  /** Résumé du tableau de bord : buzz du jour, chiffres d'activité, récap de la semaine. */
  async dashboard(userId: string): Promise<DashboardSummary> {
    const weekAgo = new Date(Date.now() - 7 * DAY_MS);
    const firstName = await this.users.firstName(userId);
    const [dueFollowUps, applications, followUpsSent, responses, interviews, weekFollowUps, weekResponses, weekInterviews] =
      await Promise.all([
        this.due(userId),
        this.prisma.application.count({ where: { userId, archivedAt: null } }),
        this.prisma.followUp.count({
          where: { application: { userId }, kind: { in: ['relance', 'relance_encore', 'linkedin'] } },
        }),
        this.prisma.application.count({ where: { userId, status: 'reponse_recue' } }),
        this.prisma.application.count({ where: { userId, responseType: 'entretien' } }),
        this.prisma.followUp.count({
          where: {
            application: { userId },
            kind: { in: ['relance', 'relance_encore', 'linkedin'] },
            sentAt: { gte: weekAgo },
          },
        }),
        this.prisma.application.count({ where: { userId, status: 'reponse_recue', respondedAt: { gte: weekAgo } } }),
        this.prisma.application.count({ where: { userId, responseType: 'entretien', respondedAt: { gte: weekAgo } } }),
      ]);

    return {
      firstName,
      dueFollowUps,
      counts: { applications, followUpsSent, responses, interviews },
      week: { followUpsSent: weekFollowUps, responses: weekResponses, interviews: weekInterviews },
    };
  }

  /** Vérifie que la candidature appartient bien à l'utilisateur (sinon 404). */
  private async requireOwned(userId: string, applicationId: string): Promise<ApplicationWithFollowUps> {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, userId },
      include: { followUps: true },
    });
    if (!application) throw new NotFoundException('Candidature introuvable.');
    return application;
  }

  private async reload(applicationId: string): Promise<PublicApplication> {
    const row = await this.prisma.application.findUniqueOrThrow({
      where: { id: applicationId },
      include: { followUps: { orderBy: { sentAt: 'desc' } } },
    });
    return toPublicApplication(row);
  }
}

function toPublicFollowUp(f: FollowUp): PublicFollowUp {
  return {
    id: f.id,
    kind: f.kind as PublicFollowUp['kind'],
    channel: f.channel as PublicFollowUp['channel'],
    subject: f.subject,
    body: f.body,
    aiGenerated: f.aiGenerated,
    sentAt: f.sentAt.toISOString(),
  };
}

function toPublicApplication(a: ApplicationWithFollowUps): PublicApplication {
  return {
    id: a.id,
    companyName: a.companyName,
    position: a.position,
    contactEmail: a.contactEmail,
    contactName: a.contactName,
    appliedAt: a.appliedAt.toISOString(),
    source: a.source,
    offerUrl: a.offerUrl,
    status: a.status,
    responseType: (a.responseType as PublicApplication['responseType']) ?? null,
    archivedAt: a.archivedAt ? a.archivedAt.toISOString() : null,
    followUpCount: a.followUpCount,
    lastFollowUpAt: a.lastFollowUpAt ? a.lastFollowUpAt.toISOString() : null,
    nextFollowUpAt: a.nextFollowUpAt ? a.nextFollowUpAt.toISOString() : null,
    respondedAt: a.respondedAt ? a.respondedAt.toISOString() : null,
    followUps: (a.followUps ?? []).map(toPublicFollowUp),
  };
}
