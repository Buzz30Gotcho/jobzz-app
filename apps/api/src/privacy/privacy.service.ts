import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { normalizeEmail } from '@jobzz/shared';
import { PrismaService } from '../prisma/prisma.service';
import { MailSender } from '../mail/mail.service';
import { accountDeletedMail } from '../mail/templates';
import { AppConfigService } from '../config/app-config.service';

/** Un fichier JSON de l'export : nom dans le ZIP + contenu sérialisable. */
export interface ExportFile {
  name: string;
  content: unknown;
}

/**
 * « Mes données » (RGPD, CLAUDE.md §4.12) : export complet et suppression définitive.
 * La suppression s'appuie sur les cascades Prisma (`onDelete: Cascade`) : un seul
 * `user.delete` efface profil, candidatures, automatisations, CV, tickets, etc.
 */
@Injectable()
export class PrivacyService {
  private readonly logger = new Logger(PrivacyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailSender,
    private readonly config: AppConfigService,
  ) {}

  /** Rassemble les données de l'utilisateur, un fichier JSON par type de données. */
  async collectExport(userId: string): Promise<ExportFile[]> {
    const [
      user,
      profile,
      applications,
      automations,
      cvDocument,
      cvAnalyses,
      cvOfferComparisons,
      tickets,
      jobOutcomes,
      subscriptionPeriods,
    ] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          email: true,
          role: true,
          plan: true,
          premiumUntil: true,
          emailVerifiedAt: true,
          offerMailEnabled: true,
          createdAt: true,
        },
      }),
      this.prisma.profile.findUnique({ where: { userId } }),
      this.prisma.application.findMany({
        where: { userId },
        include: { followUps: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.automation.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      this.prisma.cvDocument.findUnique({ where: { userId } }),
      this.prisma.cvAnalysis.findMany({ where: { userId } }),
      this.prisma.cvOfferComparison.findMany({ where: { userId } }),
      this.prisma.ticket.findMany({
        where: { userId },
        include: { messages: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.jobOutcome.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      this.prisma.subscriptionPeriod.findMany({ where: { userId }, orderBy: { startedAt: 'asc' } }),
    ]);

    return [
      { name: 'compte.json', content: user },
      { name: 'profil.json', content: profile },
      { name: 'candidatures.json', content: applications },
      { name: 'automatisations.json', content: automations },
      { name: 'cv.json', content: { document: cvDocument, analyses: cvAnalyses } },
      { name: 'comparaisons-cv-offre.json', content: cvOfferComparisons },
      { name: 'tickets.json', content: tickets },
      { name: 'jai-trouve.json', content: jobOutcomes },
      { name: 'abonnements.json', content: subscriptionPeriods },
    ];
  }

  /**
   * Suppression définitive : on exige que l'utilisateur retape exactement son email
   * (comparé normalisé), puis on supprime le compte et tout ce qui en dépend.
   */
  async deleteAccount(userId: string, confirmEmail: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Compte introuvable.');
    }
    if (normalizeEmail(confirmEmail) !== user.email) {
      throw new BadRequestException("L'email ne correspond pas à ton compte.");
    }

    const email = user.email;
    await this.prisma.user.delete({ where: { id: userId } });

    // La suppression a réussi : l'envoi du mail de confirmation ne doit jamais la remettre en cause.
    try {
      await this.mail.send(accountDeletedMail(this.config.get('APP_NAME'), email));
    } catch (error) {
      this.logger.warn(`Mail de confirmation de suppression non envoyé : ${String(error)}`);
    }
  }
}
