import { describe, expect, it } from 'vitest';
import {
  BILLING_OFFERS,
  checkoutModeFor,
  computePassPremiumUntil,
  isPremiumActive,
} from './billing';
import { PRICING } from './config';

describe('checkoutModeFor', () => {
  it('abonnement pour le mensuel et le lancement, paiement unique pour le Pass', () => {
    expect(checkoutModeFor('monthly')).toBe('subscription');
    expect(checkoutModeFor('launch')).toBe('subscription');
    expect(checkoutModeFor('pass_3_months')).toBe('payment');
  });
});

describe('BILLING_OFFERS', () => {
  it('reprend les prix de la configuration', () => {
    expect(BILLING_OFFERS.monthly.priceEur).toBe(PRICING.monthly);
    expect(BILLING_OFFERS.pass_3_months.priceEur).toBe(PRICING.pass3Months);
    expect(BILLING_OFFERS.launch.priceEur).toBe(PRICING.launch);
  });
});

describe('computePassPremiumUntil', () => {
  const now = new Date('2026-10-23T10:00:00.000Z');

  it('part de maintenant si aucun droit Premium', () => {
    const until = computePassPremiumUntil(now, null);
    expect(until.toISOString()).toBe('2027-01-23T10:00:00.000Z');
  });

  it('part de maintenant si les droits sont déjà expirés', () => {
    const past = new Date('2026-01-01T00:00:00.000Z');
    const until = computePassPremiumUntil(now, past);
    expect(until.toISOString()).toBe('2027-01-23T10:00:00.000Z');
  });

  it('cumule à partir de la date de fin future existante', () => {
    const future = new Date('2026-12-31T10:00:00.000Z');
    const until = computePassPremiumUntil(now, future);
    expect(until.toISOString()).toBe('2027-03-31T10:00:00.000Z');
  });

  it('borne le jour pour éviter un débordement de mois', () => {
    const future = new Date('2026-11-30T12:00:00.000Z');
    // 30 novembre + 3 mois = 28 février (pas le 2 mars)
    const until = computePassPremiumUntil(now, future, 3);
    expect(until.getUTCMonth()).toBe(1); // février
    expect(until.getUTCDate()).toBe(28);
  });
});

describe('isPremiumActive', () => {
  const now = new Date('2026-10-23T10:00:00.000Z');

  it('faux pour un plan gratuit', () => {
    expect(isPremiumActive('free', null, now)).toBe(false);
    expect(isPremiumActive('free', new Date('2030-01-01'), now)).toBe(false);
  });

  it('vrai pour Premium sans date de fin (abonnement récurrent)', () => {
    expect(isPremiumActive('premium', null, now)).toBe(true);
  });

  it('dépend de la date de fin pour un Premium à durée limitée', () => {
    expect(isPremiumActive('premium', new Date('2026-12-01'), now)).toBe(true);
    expect(isPremiumActive('premium', new Date('2026-01-01'), now)).toBe(false);
  });
});
