import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type Stripe from 'stripe';
import {
  BILLING_OFFERS,
  PRICING,
  checkoutModeFor,
  computePassPremiumUntil,
  isPremiumActive,
  type BillingOverview,
  type SubscriptionInfo,
  type SubscriptionOffer,
} from '@jobzz/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/app-config.service';
import { MailSender } from '../mail/mail.service';
import { paymentFailedMail, passEndingMail } from '../mail/templates';
import { StripeService } from './stripe.service';

/** Statuts internes de `SubscriptionPeriod`. */
const ACTIVE = 'active';
const ENDED = 'ended';
const CANCELED = 'canceled';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly stripe: StripeService,
    private readonly mail: MailSender,
  ) {}

  /** Places restantes de l'offre de lancement (abonnements de lancement actifs). */
  async launchSeatsRemaining(): Promise<number> {
    const taken = await this.prisma.subscriptionPeriod.count({
      where: { offer: 'launch', status: ACTIVE },
    });
    return Math.max(0, PRICING.launchSeats - taken);
  }

  /** Infos publiques pour la page Tarifs (sans utilisateur connecté). */
  async publicInfo(): Promise<Omit<BillingOverview, 'plan' | 'premiumUntil' | 'isPremium'>> {
    const remaining = await this.launchSeatsRemaining();
    return {
      stripeConfigured: this.stripe.configured,
      planEnforcement: this.config.planEnforcement,
      launchSeatsRemaining: remaining,
      offers: Object.values(BILLING_OFFERS).filter((o) => o.offer !== 'launch' || remaining > 0),
    };
  }

  /** Vue d'ensemble pour les pages Tarifs, Mon abonnement et Bienvenue en Premium. */
  async overview(userId: string): Promise<BillingOverview> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const remaining = await this.launchSeatsRemaining();
    const offers = Object.values(BILLING_OFFERS).filter(
      (o) => o.offer !== 'launch' || remaining > 0,
    );
    return {
      stripeConfigured: this.stripe.configured,
      planEnforcement: this.config.planEnforcement,
      plan: user.plan,
      premiumUntil: user.premiumUntil?.toISOString() ?? null,
      isPremium: isPremiumActive(user.plan, user.premiumUntil, new Date()),
      launchSeatsRemaining: remaining,
      offers,
    };
  }

  /** Détail de l'abonnement courant pour « Mon abonnement ». */
  async subscriptionInfo(userId: string): Promise<SubscriptionInfo> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const period = await this.prisma.subscriptionPeriod.findFirst({
      where: { userId, status: ACTIVE },
      orderBy: { startedAt: 'desc' },
    });
    if (!period) {
      return { offer: null, recurring: false, status: null, renewsOrEndsAt: null, canManage: false };
    }
    const info = BILLING_OFFERS[period.offer];
    return {
      offer: period.offer,
      recurring: info.recurring,
      status: period.status,
      renewsOrEndsAt: (period.endedAt ?? user.premiumUntil)?.toISOString() ?? null,
      // Seuls les abonnements récurrents ont un portail Stripe utile (changer de carte, résilier).
      canManage: info.recurring && Boolean(user.stripeCustomerId),
    };
  }

  /** Crée une session Stripe Checkout et renvoie l'URL de paiement. */
  async createCheckout(
    userId: string,
    email: string,
    offer: SubscriptionOffer,
  ): Promise<{ url: string }> {
    if (!this.stripe.configured) {
      throw new BadRequestException('Paiement non configuré.');
    }
    const priceId = this.stripe.priceIdFor(offer);
    if (!priceId) {
      throw new BadRequestException(`Prix Stripe non configuré pour l’offre « ${offer} ».`);
    }
    if (offer === 'launch' && (await this.launchSeatsRemaining()) <= 0) {
      throw new ConflictException("L'offre de lancement est épuisée.");
    }

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const customerId = await this.stripe.ensureCustomer(user.stripeCustomerId, email, userId);
    if (customerId !== user.stripeCustomerId) {
      await this.prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
    }

    const appUrl = this.config.get('APP_URL');
    const url = await this.stripe.createCheckoutSession({
      offer,
      mode: checkoutModeFor(offer),
      priceId,
      customerId,
      clientReferenceId: userId,
      successUrl: `${appUrl}/app/premium/bienvenue`,
      cancelUrl: `${appUrl}/tarifs`,
    });
    return { url };
  }

  /** Crée une session du portail client Stripe. */
  async createPortal(userId: string): Promise<{ url: string }> {
    if (!this.stripe.configured) {
      throw new BadRequestException('Paiement non configuré.');
    }
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.stripeCustomerId) {
      throw new NotFoundException('Aucun abonnement Stripe pour ce compte.');
    }
    const url = await this.stripe.createPortalSession(
      user.stripeCustomerId,
      `${this.config.get('APP_URL')}/app/profil/abonnement`,
    );
    return { url };
  }

  // --- Webhooks (source de vérité) --------------------------------------------------------

  /**
   * Traite un événement Stripe de façon **idempotente** : chaque `stripeEventId` n'est traité
   * qu'une seule fois (table `StripeEvent`). Un événement déjà vu est ignoré.
   */
  async handleEvent(event: Stripe.Event): Promise<{ handled: boolean; duplicate: boolean }> {
    try {
      await this.prisma.stripeEvent.create({
        data: { stripeEventId: event.id, type: event.type },
      });
    } catch {
      // Violation d'unicité → déjà traité.
      this.logger.debug(`Événement Stripe déjà traité, ignoré : ${event.id}`);
      return { handled: false, duplicate: true };
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.onSubscriptionActive(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.onSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.paid':
        await this.onInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.onInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        this.logger.debug(`Événement Stripe non traité : ${event.type}`);
    }
    return { handled: true, duplicate: false };
  }

  private async onCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    // Seul le Pass (paiement unique) est confirmé ici ; les abonnements passent par les
    // événements `customer.subscription.*`.
    if (session.mode !== 'payment') return;
    const userId = session.client_reference_id ?? session.metadata?.userId;
    if (!userId) return;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const until = computePassPremiumUntil(new Date(), user.premiumUntil);
    await this.prisma.subscriptionPeriod.create({
      data: {
        userId,
        offer: 'pass_3_months',
        stripePaymentIntentId: this.paymentIntentId(session.payment_intent),
        status: ACTIVE,
        startedAt: new Date(),
        endedAt: until,
      },
    });
    await this.setPlan(userId, 'premium', until);
  }

  private async onSubscriptionActive(sub: Stripe.Subscription): Promise<void> {
    const userId = await this.userIdForCustomer(sub.customer, sub.metadata?.userId);
    if (!userId) return;
    const offer = this.offerFromMetadata(sub.metadata?.offer);
    const active = sub.status === 'active' || sub.status === 'trialing';
    const periodEnd = this.periodEnd(sub);
    const status = active ? ACTIVE : CANCELED;
    const endedAt = active ? null : periodEnd;

    const existing = await this.prisma.subscriptionPeriod.findFirst({
      where: { stripeSubscriptionId: sub.id },
      select: { id: true },
    });
    if (existing) {
      await this.prisma.subscriptionPeriod.update({
        where: { id: existing.id },
        data: { status, endedAt },
      });
    } else {
      await this.prisma.subscriptionPeriod.create({
        data: { userId, offer, stripeSubscriptionId: sub.id, status, startedAt: new Date(), endedAt },
      });
    }

    if (active) {
      await this.setPlan(userId, 'premium', periodEnd);
    }
  }

  private async onSubscriptionDeleted(sub: Stripe.Subscription): Promise<void> {
    const userId = await this.userIdForCustomer(sub.customer, sub.metadata?.userId);
    if (!userId) return;
    await this.prisma.subscriptionPeriod.updateMany({
      where: { stripeSubscriptionId: sub.id, status: ACTIVE },
      data: { status: ENDED, endedAt: new Date() },
    });
    // Retour au gratuit sauf si un autre droit Premium (ex. Pass en cours) reste actif.
    await this.recomputePlan(userId);
  }

  private async onInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const subId = this.subscriptionIdOf(invoice);
    if (!subId) return;
    const userId = await this.userIdForCustomer(invoice.customer, undefined);
    if (!userId) return;
    const periodEnd = this.invoicePeriodEnd(invoice);
    if (periodEnd) {
      await this.setPlan(userId, 'premium', periodEnd);
    }
  }

  private async onInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const userId = await this.userIdForCustomer(invoice.customer, undefined);
    if (!userId) return;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    // Stripe réessaie automatiquement ; on prévient juste l'utilisateur avec un lien portail.
    const appName = this.config.get('APP_NAME');
    const portalUrl = `${this.config.get('APP_URL')}/app/profil/abonnement`;
    await this.mail.send(paymentFailedMail(appName, user.email, portalUrl)).catch((e) => {
      this.logger.warn(`Mail d'échec de paiement non envoyé : ${(e as Error).message}`);
    });
  }

  // --- Changements de plan -----------------------------------------------------------------

  /** Applique un plan + date de fin, et applique les règles de passage gratuit ↔ Premium. */
  private async setPlan(
    userId: string,
    plan: 'free' | 'premium',
    premiumUntil: Date | null,
  ): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { plan, premiumUntil } });
    if (plan === 'free') {
      await this.downgradeAutomations(userId);
    }
  }

  /** Recalcule le plan d'après les droits restants (après résiliation). */
  private async recomputePlan(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    const stillActive = await this.prisma.subscriptionPeriod.findFirst({
      where: { userId, status: ACTIVE },
    });
    const passUntil = user.premiumUntil;
    const passStillValid = passUntil != null && passUntil.getTime() > Date.now();
    if (stillActive || passStillValid) {
      return; // reste Premium
    }
    await this.setPlan(userId, 'free', null);
  }

  /**
   * Passage Premium → gratuit (CLAUDE.md §2) : la plus ancienne automatisation active reste
   * active (elle devient l'automatisation découverte, rythme hebdomadaire piloté par le plan) ;
   * les autres passent en pause.
   */
  async downgradeAutomations(userId: string): Promise<void> {
    const active = await this.prisma.automation.findMany({
      where: { userId, status: 'active' },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    const toPause = active.slice(1).map((a) => a.id);
    if (toPause.length > 0) {
      await this.prisma.automation.updateMany({
        where: { id: { in: toPause } },
        data: { status: 'en_pause' },
      });
    }
  }

  /** Tâche quotidienne : repasse en gratuit les comptes dont `premiumUntil` est dépassé. */
  async expireLapsedPremium(now: Date = new Date()): Promise<number> {
    const lapsed = await this.prisma.user.findMany({
      where: { plan: 'premium', premiumUntil: { not: null, lt: now } },
      select: { id: true },
    });
    for (const u of lapsed) {
      await this.prisma.subscriptionPeriod.updateMany({
        where: { userId: u.id, status: ACTIVE, endedAt: { lt: now } },
        data: { status: ENDED },
      });
      await this.setPlan(u.id, 'free', null);
    }
    return lapsed.length;
  }

  /** Préavis : prévient 7 jours avant la fin d'un Pass 3 mois. */
  async noticePassEnding(now: Date = new Date()): Promise<number> {
    const from = new Date(now.getTime());
    const to = new Date(now.getTime() + PRICING.passEndingNoticeDays * 24 * 3600 * 1000);
    const ending = await this.prisma.subscriptionPeriod.findMany({
      where: { offer: 'pass_3_months', status: ACTIVE, endedAt: { gte: from, lte: to } },
      include: { user: { select: { email: true } } },
    });
    const appName = this.config.get('APP_NAME');
    for (const p of ending) {
      await this.mail
        .send(passEndingMail(appName, p.user.email, p.endedAt as Date, `${this.config.get('APP_URL')}/tarifs`))
        .catch(() => undefined);
    }
    return ending.length;
  }

  // --- Helpers de lecture des payloads Stripe (sans appel réseau) ---------------------------

  private offerFromMetadata(value: string | undefined): SubscriptionOffer {
    if (value === 'launch' || value === 'pass_3_months' || value === 'monthly') return value;
    return 'monthly';
  }

  private async userIdForCustomer(
    customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
    fallbackUserId: string | undefined,
  ): Promise<string | null> {
    if (fallbackUserId) return fallbackUserId;
    const customerId = typeof customer === 'string' ? customer : customer?.id;
    if (!customerId) return null;
    const user = await this.prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
    return user?.id ?? null;
  }

  private paymentIntentId(
    pi: string | Stripe.PaymentIntent | null | undefined,
  ): string | null {
    if (!pi) return null;
    return typeof pi === 'string' ? pi : pi.id;
  }

  private subscriptionIdOf(invoice: Stripe.Invoice): string | null {
    const sub = (invoice as unknown as { subscription?: string | { id: string } }).subscription;
    if (!sub) return null;
    return typeof sub === 'string' ? sub : sub.id;
  }

  private periodEnd(sub: Stripe.Subscription): Date | null {
    const raw =
      (sub as unknown as { current_period_end?: number }).current_period_end ??
      sub.items?.data?.[0]?.current_period_end;
    return raw ? new Date(raw * 1000) : null;
  }

  private invoicePeriodEnd(invoice: Stripe.Invoice): Date | null {
    const end = invoice.lines?.data?.[0]?.period?.end;
    return end ? new Date(end * 1000) : null;
  }
}
