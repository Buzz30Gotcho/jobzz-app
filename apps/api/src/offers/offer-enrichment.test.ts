import { describe, expect, it } from 'vitest';
import type { NormalizedOffer } from '@jobzz/shared';
import { enrichOfferRules } from './offer-enrichment';

function offer(description: string, remote: string | null = null): NormalizedOffer {
  return {
    source: 'demo', externalId: '1', url: '', title: 'Dev', companyName: null, siret: null,
    locationLabel: null, communeCode: null, lat: null, lng: null, contractType: 'alternance',
    contractNature: null, remote, startDate: null, startFlexible: null, durationMonths: null,
    experienceRequired: null, salaryText: null, skills: [], romeCodes: [], description,
    publishedAt: null, sourceUpdatedAt: null, isDemo: true,
  };
}

describe('enrichOfferRules', () => {
  it('détecte le télétravail dans le texte si le champ est absent', () => {
    const r = enrichOfferRules(offer('Poste en télétravail complet'));
    expect(r.attributes.remote).toBe('distance');
    expect(r.confidence.remote).toBeGreaterThan(0);
  });

  it('garde le champ structuré de télétravail en priorité', () => {
    const r = enrichOfferRules(offer('bla', 'hybride'));
    expect(r.attributes.remote).toBe('hybride');
    expect(r.confidence.remote).toBe(1);
  });

  it('détecte le rythme d\'alternance et les indices d\'ESN', () => {
    const r = enrichOfferRules(offer('Rythme 3 semaines / 1 semaine, mission en régie chez le client final'));
    expect(r.attributes.rhythm).toContain('3 semaines');
    expect(r.attributes.esn).toBe(true);
  });
});
