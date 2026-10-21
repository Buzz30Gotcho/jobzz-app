import { describe, expect, it } from 'vitest';
import { applyDailyViewLimit } from './offer-view-limit';

const offers = Array.from({ length: 30 }, (_, i) => ({ id: `o${i}` }));

describe('applyDailyViewLimit', () => {
  it('illimité : rien n\'est flouté', () => {
    const r = applyDailyViewLimit(offers, new Set(), null);
    expect(r.offers.every((o) => !o.locked)).toBe(true);
    expect(r.remainingMatches).toBe(0);
  });

  it('gratuit : floute au-delà de la limite et donne le vrai nombre restant', () => {
    const r = applyDailyViewLimit(offers, new Set(), 25);
    expect(r.offers.filter((o) => !o.locked).length).toBe(25);
    expect(r.viewedCount).toBe(25);
    expect(r.remainingMatches).toBe(5); // 30 - 25
    expect(r.newlyViewedIds.length).toBe(25);
  });

  it('une offre déjà vue reste lisible et compte dans le total du jour', () => {
    // Limite = 25 offres/jour au total ; 3 déjà vues ⇒ quota restant 22.
    const already = new Set(['o0', 'o1', 'o2']);
    const r = applyDailyViewLimit(offers, already, 25);
    expect(r.offers.filter((o) => !o.locked).length).toBe(25); // 3 déjà vues + 22 nouvelles
    expect(r.newlyViewedIds.length).toBe(22);
    expect(r.remainingMatches).toBe(5); // 30 - 25
    expect(r.newlyViewedIds).not.toContain('o0');
  });

  it('quota déjà épuisé : tout le reste est flouté', () => {
    const already = new Set(Array.from({ length: 25 }, (_, i) => `x${i}`));
    const r = applyDailyViewLimit(offers, already, 25);
    expect(r.offers.every((o) => o.locked)).toBe(true);
    expect(r.remainingMatches).toBe(30);
  });
});
