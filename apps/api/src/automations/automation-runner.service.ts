import { Injectable, Logger } from '@nestjs/common';
import type { Automation, Prisma, User } from '@prisma/client';
import { AUTOMATIONS, OFFER_MAIL, automationCriteriaSchema, type AutomationCriteria, type NormalizedOffer } from '@jobzz/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/app-config.service';
import { MailSender } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { OffersService } from '../offers/offers.service';
import { SourcesService } from '../sources/sources.service';
import type { SourceQuery } from '../sources/job-source';
import { runAutomation, type AutomationMatch } from './automation-engine';
import { shouldSendDigest } from './digest-schedule';
import { buildOfferDigestEmail, type DigestSection } from './offer-digest.template';
import { signUnsubscribeToken } from './unsubscribe-token';

export interface RunSummary {
  sent: boolean;
  reason?: string;
  candidates: number;
}

@Injectable()
export class AutomationRunnerService {
  private readonly logger = new Logger(AutomationRunnerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly mail: MailSender,
    private readonly users: UsersService,
    private readonly offers: OffersService,
    private readonly sources: SourcesService,
  ) {}

  /** Tâche périodique : exécute les automatisations de tous les utilisateurs éligibles. */
  async runAll(): Promise<void> {
    const users = await this.prisma.user.findMany({
      where: { automations: { some: { status: 'active' } }, emailVerifiedAt: { not: null }, disabledAt: null },
      select: { id: true },
    });
    for (const u of users) {
      try {
        await this.runForUser(u.id);
      } catch (err) {
        this.logger.warn(`Automatisations échouées pour ${u.id} : ${(err as Error).message}`);
      }
    }
  }

  /** Exécute les automatisations d'un utilisateur et envoie le mail si la cadence le permet. */
  async runForUser(userId: string, options: { force?: boolean } = {}): Promise<RunSummary> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { sent: false, reason: 'compte introuvable', candidates: 0 };
    if (!user.emailVerifiedAt || user.disabledAt) return { sent: false, reason: 'compte non éligible', candidates: 0 };
    if (!user.offerMailEnabled) return { sent: false, reason: 'mail des offres désactivé', candidates: 0 };

    const automations = await this.prisma.automation.findMany({ where: { userId, status: 'active' } });
    if (automations.length === 0) return { sent: false, reason: 'aucune automatisation active', candidates: 0 };

    const premium = user.plan === 'premium';

    const sentRows = await this.prisma.automationMatch.findMany({
      where: { userId, status: 'sent' },
      select: { offerId: true },
    });
    const alreadySent = new Set(sentRows.map((r) => r.offerId));
    const usedThisRun = new Set<string>();

    const sections: { automationId: string; name: string; offers: { offerId: string; offer: NormalizedOffer; score: number; explanation: string }[] }[] = [];

    for (const auto of automations) {
      // Ignore proprement une automatisation au format incompatible (ancien seed).
      const parsedCriteria = automationCriteriaSchema.safeParse(auto.criteria);
      if (!parsedCriteria.success) continue;
      const criteria = parsedCriteria.data;
      const started = new Date();
      let funnel = { trouvees: 0, apresMetierLieu: 0, apresContratDateJunior: 0, auDessusDuScore: 0 };
      let errors: string[] = [];
      try {
        const result = await this.sources.search(this.toSourceQuery(criteria));
        errors = result.errors;
        const recent = result.offers.filter(
          (o) => !o.publishedAt || Date.now() - Date.parse(o.publishedAt) <= criteria.fraicheurJours * 864e5,
        );
        const run = runAutomation(recent, criteria);
        funnel = run.funnel;

        const stored = await this.offers.persistOffers(run.kept.map((k) => k.offer));
        const idByKey = new Map(stored.map((s) => [`${s.offer.source}:${s.offer.externalId}`, s.id]));

        const sectionOffers = this.pickOffers(run.kept, idByKey, alreadySent, usedThisRun, premium);
        if (sectionOffers.length > 0) sections.push({ automationId: auto.id, name: auto.name, offers: sectionOffers });

        await this.recordRun(auto, started, errors, funnel);
      } catch (err) {
        errors = [(err as Error).message];
        await this.recordRun(auto, started, errors, funnel);
      }
    }

    const candidates = sections.reduce((n, s) => n + s.offers.length, 0);
    const decision =
      options.force === true ||
      shouldSendDigest({ isPremium: premium, lastMailAt: user.lastOfferMailAt, now: new Date(), hasNewOffers: candidates > 0 });
    if (!decision) return { sent: false, reason: 'cadence non atteinte ou aucune offre', candidates };

    const sent = await this.sendDigest(user, sections, premium);
    return { sent, reason: sent ? undefined : 'aucune offre à envoyer', candidates };
  }

  // --- interne ---

  private pickOffers(
    kept: AutomationMatch[],
    idByKey: Map<string, string>,
    alreadySent: Set<string>,
    usedThisRun: Set<string>,
    premium: boolean,
  ): { offerId: string; offer: NormalizedOffer; score: number; explanation: string }[] {
    const max = premium ? OFFER_MAIL.maxOffersPerAutomation : AUTOMATIONS.discoveryOffersPerMail;
    const out: { offerId: string; offer: NormalizedOffer; score: number; explanation: string }[] = [];
    for (const k of kept) {
      const offerId = idByKey.get(`${k.offer.source}:${k.offer.externalId}`);
      if (!offerId || alreadySent.has(offerId) || usedThisRun.has(offerId)) continue;
      usedThisRun.add(offerId);
      out.push({ offerId, offer: k.offer, score: k.score.score, explanation: k.score.explanation });
      if (out.length >= max) break;
    }
    return out;
  }

  private async recordRun(
    auto: Automation,
    startedAt: Date,
    errors: string[],
    funnel: Record<string, number>,
  ): Promise<void> {
    const failed = errors.length > 0 && funnel.trouvees === 0;
    await this.prisma.automationRun.create({
      data: {
        automationId: auto.id,
        startedAt,
        finishedAt: new Date(),
        status: errors.length === 0 ? 'success' : failed ? 'failed' : 'partial',
        funnel: funnel as Prisma.InputJsonValue,
        errors: errors as Prisma.InputJsonValue,
      },
    });
    const consecutiveFailures = failed ? auto.consecutiveFailures + 1 : 0;
    await this.prisma.automation.update({
      where: { id: auto.id },
      data: {
        lastRunAt: new Date(),
        lastSuccessAt: errors.length === 0 ? new Date() : auto.lastSuccessAt,
        consecutiveFailures,
        status: consecutiveFailures >= AUTOMATIONS.failuresBeforeError ? 'erreur' : auto.status,
      },
    });
  }

  private async sendDigest(
    user: User,
    sections: { automationId: string; name: string; offers: { offerId: string; offer: NormalizedOffer; score: number; explanation: string }[] }[],
    premium: boolean,
  ): Promise<boolean> {
    // Plafond total par mail.
    let budget = premium ? OFFER_MAIL.maxOffersPerMail : AUTOMATIONS.discoveryOffersPerMail;
    const capped = sections
      .map((s) => {
        const take = s.offers.slice(0, budget);
        budget -= take.length;
        return { ...s, offers: take };
      })
      .filter((s) => s.offers.length > 0);
    if (capped.length === 0) return false;

    const firstName = await this.users.firstName(user.id);
    const appUrl = this.config.get('APP_URL');
    const token = signUnsubscribeToken(user.id, this.config.get('REFRESH_TOKEN_SECRET'));

    const digest = await this.prisma.offerDigest.create({
      data: { userId: user.id, sentAt: new Date(), offerCount: capped.reduce((n, s) => n + s.offers.length, 0) },
    });

    // Enregistre les correspondances envoyées (idempotent par automation+offre).
    for (const s of capped) {
      for (const o of s.offers) {
        await this.prisma.automationMatch.upsert({
          where: { automationId_offerId: { automationId: s.automationId, offerId: o.offerId } },
          create: {
            automationId: s.automationId,
            offerId: o.offerId,
            userId: user.id,
            score: o.score,
            explanation: o.explanation,
            status: 'sent',
            digestId: digest.id,
          },
          update: { status: 'sent', digestId: digest.id },
        });
      }
    }

    const emailSections: DigestSection[] = capped.map((s) => ({
      automationName: s.name,
      offers: s.offers.map((o) => ({
        title: o.offer.title,
        companyName: o.offer.companyName,
        locationLabel: o.offer.locationLabel,
        contractType: o.offer.contractType,
        source: o.offer.source,
        publishedAt: o.offer.publishedAt,
        url: o.offer.url,
        isDemo: o.offer.isDemo,
      })),
    }));

    const email = buildOfferDigestEmail({
      appName: this.config.get('APP_NAME'),
      firstName,
      sections: emailSections,
      manageUrl: `${appUrl}/app/offres/automatisations`,
      unsubscribeUrl: `${appUrl}/desinscription?token=${encodeURIComponent(token)}`,
    });

    await this.mail.send({ ...email, to: user.email });
    await this.prisma.user.update({ where: { id: user.id }, data: { lastOfferMailAt: new Date() } });
    return true;
  }

  private toSourceQuery(c: AutomationCriteria): SourceQuery {
    const first = c.lieux[0];
    return {
      romeCodes: c.metiers.flatMap((m) => m.romeCodes),
      motsCles: c.metiers[0]?.label,
      communeCode: first?.communeCode ?? undefined,
      lat: first?.lat ?? undefined,
      lng: first?.lng ?? undefined,
      distanceKm: first?.radiusKm,
      contractTypes: c.contrats,
      publishedSinceDays: c.fraicheurJours,
    };
  }

  /** Désinscription en un clic : coupe le mail des offres, le compte reste intact. */
  async unsubscribe(userId: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { offerMailEnabled: false } });
  }
}
