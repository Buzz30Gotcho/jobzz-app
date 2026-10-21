import { describe, expect, it } from 'vitest';
import { buildDemoOffers } from './demo-offers';

describe('buildDemoOffers', () => {
  const offers = buildDemoOffers(new Date('2026-10-21T12:00:00Z'));

  it('génère une variété d\'offres fictives', () => {
    expect(offers.length).toBeGreaterThanOrEqual(36);
    expect(offers.every((o) => o.isDemo)).toBe(true);
    expect(offers.every((o) => o.companyName?.startsWith('Entreprise Fictive'))).toBe(true);
  });

  it('contient des contrats variés et des offres senior (pour le filtre junior)', () => {
    const contrats = new Set(offers.map((o) => o.contractType));
    expect(contrats.has('alternance')).toBe(true);
    expect(contrats.has('cdi')).toBe(true);
    expect(offers.some((o) => /senior|lead|directeur/i.test(o.title))).toBe(true);
  });
});
