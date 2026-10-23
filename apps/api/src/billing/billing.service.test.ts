import { ConflictException } from '@nestjs/common';
import type Stripe from 'stripe';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service';
import type { AppConfigService } from '../config/app-config.service';
import type { MailSender } from '../mail/mail.service';
import { BillingService } from './billing.service';
import type { StripeService } from './stripe.service';

interface Mocks {
  prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;
  stripe: Partial<StripeService>;
  mail: { send: ReturnType<typeof vi.fn> };
}

function makeService(over: Partial<Mocks> = {}) {
  const defaults: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
      findUniqueOrThrow: vi.fn(),
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
    },
    subscriptionPeriod: {
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({}),
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
    },
    stripeEvent: { create: vi.fn().mockResolvedValue({}) },
    automation: { findMany: vi.fn().mockResolvedValue([]), updateMany: vi.fn().mockResolvedValue({}) },
  };
  // Fusion par table : un override ne remplace que les méthodes fournies, pas toute la table.
  const prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {};
  for (const table of Object.keys(defaults)) {
    prisma[table] = { ...defaults[table], ...((over.prisma?.[table] as never) ?? {}) };
  }
  const config = {
    planEnforcement: true,
    get: vi.fn((k: string) =>
      ({ APP_URL: 'http://localhost:4200', APP_NAME: 'Jobzz' }[k] ?? ''),
    ),
  } as unknown as AppConfigService;
  const stripe = {
    configured: true,
    priceIdFor: vi.fn().mockReturnValue('price_123'),
    ensureCustomer: vi.fn().mockResolvedValue('cus_1'),
    createCheckoutSession: vi.fn().mockResolvedValue('https://stripe.test/checkout'),
    createPortalSession: vi.fn().mockResolvedValue('https://stripe.test/portal'),
    ...(over.stripe ?? {}),
  } as unknown as StripeService;
  const mail = over.mail ?? { send: vi.fn().mockResolvedValue(undefined) };
  const service = new BillingService(
    prisma as unknown as PrismaService,
    config,
    stripe,
    mail as unknown as MailSender,
  );
  return { service, prisma, stripe, mail, config };
}

function event(type: string, object: unknown, id = 'evt_1'): Stripe.Event {
  return { id, type, data: { object } } as unknown as Stripe.Event;
}

describe('BillingService.handleEvent — idempotence', () => {
  it('traite un événement une seule fois', async () => {
    const { service, prisma } = makeService();
    prisma.stripeEvent.create
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('unique'));

    const evt = event('customer.subscription.deleted', { customer: 'cus_x', metadata: {} });
    const first = await service.handleEvent(evt);
    const second = await service.handleEvent(evt);

    expect(first).toEqual({ handled: true, duplicate: false });
    expect(second).toEqual({ handled: false, duplicate: true });
  });
});

describe('BillingService.handleEvent — Pass 3 mois (checkout.session.completed)', () => {
  it('passe Premium, crée la période et cumule la date de fin', async () => {
    const future = new Date('2026-12-31T10:00:00.000Z');
    const { service, prisma } = makeService({
      prisma: {
        user: { findUnique: vi.fn().mockResolvedValue({ id: 'u1', premiumUntil: future }) },
      } as never,
    });

    await service.handleEvent(
      event('checkout.session.completed', {
        mode: 'payment',
        client_reference_id: 'u1',
        payment_intent: 'pi_1',
        metadata: { offer: 'pass_3_months' },
      }),
    );

    expect(prisma.subscriptionPeriod.create).toHaveBeenCalledOnce();
    const created = prisma.subscriptionPeriod.create.mock.calls[0][0].data;
    expect(created.offer).toBe('pass_3_months');
    expect(created.status).toBe('active');
    // 31 déc. + 3 mois = 31 mars (cumul sur les droits futurs existants).
    expect((created.endedAt as Date).toISOString()).toBe('2027-03-31T10:00:00.000Z');

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1' }, data: expect.objectContaining({ plan: 'premium' }) }),
    );
  });

  it('ignore une session Checkout en mode abonnement (gérée par les events subscription.*)', async () => {
    const { service, prisma } = makeService();
    await service.handleEvent(
      event('checkout.session.completed', { mode: 'subscription', client_reference_id: 'u1' }),
    );
    expect(prisma.subscriptionPeriod.create).not.toHaveBeenCalled();
  });
});

describe('BillingService.handleEvent — abonnement actif', () => {
  it('passe Premium avec la date de fin de période', async () => {
    const { service, prisma } = makeService();
    const periodEnd = Math.floor(new Date('2026-11-23T10:00:00.000Z').getTime() / 1000);

    await service.handleEvent(
      event('customer.subscription.created', {
        id: 'sub_1',
        customer: 'cus_1',
        status: 'active',
        metadata: { userId: 'u1', offer: 'monthly' },
        items: { data: [{ current_period_end: periodEnd }] },
      }),
    );

    expect(prisma.subscriptionPeriod.create).toHaveBeenCalledOnce();
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ plan: 'premium', premiumUntil: new Date(periodEnd * 1000) }),
      }),
    );
  });
});

describe('BillingService.handleEvent — résiliation', () => {
  it('termine la période et repasse en gratuit si plus aucun droit', async () => {
    const { service, prisma } = makeService({
      prisma: {
        user: { findUnique: vi.fn().mockResolvedValue({ id: 'u1', premiumUntil: null }) },
        subscriptionPeriod: {
          updateMany: vi.fn().mockResolvedValue({}),
          findFirst: vi.fn().mockResolvedValue(null), // plus d'abonnement actif
        },
        automation: { findMany: vi.fn().mockResolvedValue([]), updateMany: vi.fn() },
      } as never,
    });

    await service.handleEvent(
      event('customer.subscription.deleted', { id: 'sub_1', customer: 'cus_1', metadata: { userId: 'u1' } }),
    );

    expect(prisma.subscriptionPeriod.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'ended', endedAt: expect.any(Date) } }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { plan: 'free', premiumUntil: null } }),
    );
  });
});

describe('BillingService.handleEvent — échec de paiement', () => {
  it('envoie un mail avec le lien du portail', async () => {
    const { service, mail } = makeService({
      prisma: {
        user: {
          findFirst: vi.fn().mockResolvedValue({ id: 'u1', email: 'u1@test.fr' }),
          findUnique: vi.fn().mockResolvedValue({ id: 'u1', email: 'u1@test.fr' }),
        },
      } as never,
    });

    await service.handleEvent(
      event('invoice.payment_failed', { customer: 'cus_1', lines: { data: [] } }),
    );

    expect(mail.send).toHaveBeenCalledOnce();
    expect(mail.send.mock.calls[0][0].to).toBe('u1@test.fr');
  });
});

describe('BillingService.createCheckout — offre de lancement', () => {
  it('refuse quand les 100 places sont prises', async () => {
    const { service } = makeService({
      prisma: {
        subscriptionPeriod: { count: vi.fn().mockResolvedValue(100) },
        user: { findUniqueOrThrow: vi.fn().mockResolvedValue({ id: 'u1', stripeCustomerId: 'cus_1' }) },
      } as never,
    });
    await expect(service.createCheckout('u1', 'u1@test.fr', 'launch')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('autorise quand il reste des places', async () => {
    const { service, stripe } = makeService({
      prisma: {
        subscriptionPeriod: { count: vi.fn().mockResolvedValue(99) },
        user: {
          findUniqueOrThrow: vi.fn().mockResolvedValue({ id: 'u1', stripeCustomerId: 'cus_1' }),
          update: vi.fn(),
        },
      } as never,
    });
    const { url } = await service.createCheckout('u1', 'u1@test.fr', 'launch');
    expect(url).toBe('https://stripe.test/checkout');
    expect(stripe.createCheckoutSession).toHaveBeenCalled();
  });
});

describe('BillingService.downgradeAutomations', () => {
  it('garde la plus ancienne active et met les autres en pause', async () => {
    const { service, prisma } = makeService({
      prisma: {
        automation: {
          findMany: vi.fn().mockResolvedValue([{ id: 'old' }, { id: 'b' }, { id: 'c' }]),
          updateMany: vi.fn().mockResolvedValue({}),
        },
      } as never,
    });
    await service.downgradeAutomations('u1');
    expect(prisma.automation.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['b', 'c'] } },
      data: { status: 'en_pause' },
    });
  });

  it('ne touche à rien si une seule automatisation active', async () => {
    const { service, prisma } = makeService({
      prisma: {
        automation: { findMany: vi.fn().mockResolvedValue([{ id: 'old' }]), updateMany: vi.fn() },
      } as never,
    });
    await service.downgradeAutomations('u1');
    expect(prisma.automation.updateMany).not.toHaveBeenCalled();
  });
});

describe('BillingService.expireLapsedPremium', () => {
  it('repasse en gratuit les comptes dont premiumUntil est dépassé', async () => {
    const { service, prisma } = makeService({
      prisma: {
        user: {
          findMany: vi.fn().mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]),
          update: vi.fn().mockResolvedValue({}),
        },
        subscriptionPeriod: { updateMany: vi.fn().mockResolvedValue({}) },
        automation: { findMany: vi.fn().mockResolvedValue([]), updateMany: vi.fn() },
      } as never,
    });
    const count = await service.expireLapsedPremium(new Date('2026-10-23T00:00:00Z'));
    expect(count).toBe(2);
    expect(prisma.user.update).toHaveBeenCalledTimes(2);
  });
});
