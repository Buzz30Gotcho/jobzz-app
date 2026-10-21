import { describe, expect, it } from 'vitest';
import { computeOfferScore, scoreLabel, type ScorableOffer, type ScoringProfile } from './offer-score';

const baseProfile: ScoringProfile = {
  skills: ['React', 'SQL'],
  romeCodes: ['M1805'],
  jobLabels: ['développeur web'],
  locations: [{ lat: 43.61, lng: 3.87, radiusKm: 30 }],
  availableFrom: '2027-01-15',
  experienceLevel: 'debutant',
};

const baseOffer: ScorableOffer = {
  title: 'Développeur web',
  description: 'Stack React et SQL',
  skills: ['React', 'SQL', 'Docker'],
  romeCodes: ['M1805'],
  contractType: 'alternance',
  remote: null,
  lat: 43.61,
  lng: 3.87,
  startDate: '2027-01-20',
  startFlexible: null,
  durationMonths: 12,
  experienceRequired: null,
};

describe('computeOfferScore', () => {
  it('score élevé quand métier, lieu, date et compétences correspondent', () => {
    const r = computeOfferScore(baseOffer, baseProfile);
    expect(r.score).toBeGreaterThanOrEqual(80);
    expect(r.label).toBe('Excellent match');
    expect(r.matched).toContain('React');
    expect(r.missing).toContain('Docker');
    expect(r.explanation).toContain('React');
    expect(r.explanation).toContain('Docker');
  });

  it('offre sans compétences listées → sous-score compétences 0,6 et explication dédiée', () => {
    const r = computeOfferScore({ ...baseOffer, skills: [] }, baseProfile);
    expect(r.explanation).toContain('compétences non précisées');
  });

  it('métier d\'un autre domaine fait baisser le score', () => {
    const r = computeOfferScore({ ...baseOffer, romeCodes: ['D1106'], description: 'vente' }, baseProfile);
    expect(r.score).toBeLessThan(computeOfferScore(baseOffer, baseProfile).score);
  });

  it('borne le score entre 0 et 100', () => {
    const r = computeOfferScore(baseOffer, baseProfile);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });
});

describe('scoreLabel', () => {
  it('applique les seuils de la configuration', () => {
    expect(scoreLabel(85)).toBe('Excellent match');
    expect(scoreLabel(65)).toBe('Bon match');
    expect(scoreLabel(45)).toBe('À explorer');
    expect(scoreLabel(30)).toBe('');
  });
});
