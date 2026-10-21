import { describe, expect, it } from 'vitest';
import { shouldSendDigest } from './digest-schedule';

// 2026-10-20 est un mardi ; 2026-10-19 un lundi.
const mardi14h = new Date('2026-10-20T12:00:00Z'); // ~14h Paris (heure d'été : +2 ; ici +2? oct = CEST jusqu'au 25/10)
const mardi23h = new Date('2026-10-20T21:30:00Z'); // ~23h30 Paris
const lundi8h = new Date('2026-10-19T06:00:00Z'); // 8h Paris

describe('shouldSendDigest — Premium', () => {
  it('envoie en journée s\'il y a des offres et pas de mail récent', () => {
    expect(shouldSendDigest({ isPremium: true, lastMailAt: null, now: mardi14h, hasNewOffers: true })).toBe(true);
  });

  it('n\'envoie pas sans nouvelle offre', () => {
    expect(shouldSendDigest({ isPremium: true, lastMailAt: null, now: mardi14h, hasNewOffers: false })).toBe(false);
  });

  it('respecte les heures calmes (nuit)', () => {
    expect(shouldSendDigest({ isPremium: true, lastMailAt: null, now: mardi23h, hasNewOffers: true })).toBe(false);
  });

  it('respecte le délai minimum entre deux mails', () => {
    const recent = new Date(mardi14h.getTime() - 60 * 60 * 1000); // 1 h avant
    expect(shouldSendDigest({ isPremium: true, lastMailAt: recent, now: mardi14h, hasNewOffers: true })).toBe(false);
  });
});

describe('shouldSendDigest — Gratuit (hebdomadaire lundi 8h)', () => {
  it('envoie le lundi à 8 h', () => {
    expect(shouldSendDigest({ isPremium: false, lastMailAt: null, now: lundi8h, hasNewOffers: true })).toBe(true);
  });

  it('n\'envoie pas un mardi', () => {
    expect(shouldSendDigest({ isPremium: false, lastMailAt: null, now: mardi14h, hasNewOffers: true })).toBe(false);
  });
});
