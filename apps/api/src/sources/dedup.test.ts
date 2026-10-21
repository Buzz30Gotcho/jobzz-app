import { describe, expect, it } from 'vitest';
import type { NormalizedOffer } from '@jobzz/shared';
import { dedupeOffers } from './dedup';

function offer(partial: Partial<NormalizedOffer>): NormalizedOffer {
  return {
    source: 'a',
    externalId: Math.random().toString(),
    url: '',
    title: 'Développeur web',
    companyName: 'Acme',
    siret: null,
    locationLabel: 'Montpellier',
    communeCode: '34172',
    lat: null,
    lng: null,
    contractType: 'cdi',
    contractNature: null,
    remote: null,
    startDate: null,
    startFlexible: null,
    durationMonths: null,
    experienceRequired: null,
    salaryText: null,
    skills: [],
    romeCodes: [],
    description: '',
    publishedAt: null,
    sourceUpdatedAt: null,
    isDemo: false,
    ...partial,
  };
}

describe('dedupeOffers', () => {
  it('fusionne la même entreprise + titre + commune entre deux sources', () => {
    const list = [offer({ source: 'franceTravail' }), offer({ source: 'laBonneAlternance', companyName: 'ACME SAS' })];
    expect(dedupeOffers(list)).toHaveLength(1);
  });

  it('fusionne par SIRET + titre', () => {
    const list = [offer({ siret: '12345678900011' }), offer({ siret: '12345678900011', companyName: 'Autre nom' })];
    expect(dedupeOffers(list)).toHaveLength(1);
  });

  it('garde des offres de titres différents', () => {
    const list = [offer({ title: 'Développeur web' }), offer({ title: 'Data analyst' })];
    expect(dedupeOffers(list)).toHaveLength(2);
  });
});
