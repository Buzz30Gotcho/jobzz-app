import { describe, expect, it } from 'vitest';
import { canConsume, resolveLimit } from './entitlements';
import { FREE_LIMITS, PREMIUM_LIMITS } from './config';

describe('resolveLimit', () => {
  describe('PLAN_ENFORCEMENT=false (défaut local)', () => {
    it('traite tout le monde comme Premium illimité', () => {
      const r = resolveLimit('offers_viewed', {
        plan: 'free',
        role: 'user',
        planEnforcement: false,
      });
      expect(r).toEqual({ allowed: true, limit: null, period: 'day' });
    });

    it('autorise aussi les fonctionnalités IA en gratuit', () => {
      const r = resolveLimit('ai_message', { plan: 'free', role: 'user', planEnforcement: false });
      expect(r.allowed).toBe(true);
      expect(r.limit).toBeNull();
    });
  });

  describe('PLAN_ENFORCEMENT=true', () => {
    it('applique la limite du gratuit sur les offres vues', () => {
      const r = resolveLimit('offers_viewed', {
        plan: 'free',
        role: 'user',
        planEnforcement: true,
      });
      expect(r).toEqual({
        allowed: true,
        limit: FREE_LIMITS.offersViewedPerDay,
        period: 'day',
      });
    });

    it('interdit les messages IA au gratuit', () => {
      const r = resolveLimit('ai_message', { plan: 'free', role: 'user', planEnforcement: true });
      expect(r.allowed).toBe(false);
      expect(r.limit).toBe(0);
    });

    it('applique la limite Premium des messages IA', () => {
      const r = resolveLimit('ai_message', {
        plan: 'premium',
        role: 'user',
        planEnforcement: true,
      });
      expect(r.allowed).toBe(true);
      expect(r.limit).toBe(PREMIUM_LIMITS.aiMessagesPerDay);
    });

    it("donne tout à l'admin, sans limite, même en gratuit", () => {
      const r = resolveLimit('ai_message', { plan: 'free', role: 'admin', planEnforcement: true });
      expect(r).toEqual({ allowed: true, limit: null, period: 'day' });
    });

    it('autorise une seule automatisation active au gratuit', () => {
      const r = resolveLimit('active_automations', {
        plan: 'free',
        role: 'user',
        planEnforcement: true,
      });
      expect(r.limit).toBe(FREE_LIMITS.activeAutomations);
      expect(r.period).toBe('none');
    });
  });
});

describe('canConsume', () => {
  it('autorise tant que le compteur est sous la limite', () => {
    const resolved = resolveLimit('offers_viewed', {
      plan: 'free',
      role: 'user',
      planEnforcement: true,
    });
    expect(canConsume(resolved, 0)).toEqual({ allowed: true, remaining: 25 });
    expect(canConsume(resolved, 24)).toEqual({ allowed: true, remaining: 1 });
  });

  it('refuse quand la limite est atteinte', () => {
    const resolved = resolveLimit('offers_viewed', {
      plan: 'free',
      role: 'user',
      planEnforcement: true,
    });
    expect(canConsume(resolved, 25)).toEqual({ allowed: false, remaining: 0 });
    expect(canConsume(resolved, 30)).toEqual({ allowed: false, remaining: 0 });
  });

  it('autorise sans compteur quand la limite est illimitée', () => {
    const resolved = resolveLimit('offers_viewed', {
      plan: 'premium',
      role: 'user',
      planEnforcement: true,
    });
    expect(canConsume(resolved, 9999)).toEqual({ allowed: true, remaining: null });
  });

  it('refuse une fonctionnalité interdite (limite 0)', () => {
    const resolved = resolveLimit('ai_message', {
      plan: 'free',
      role: 'user',
      planEnforcement: true,
    });
    expect(canConsume(resolved, 0)).toEqual({ allowed: false, remaining: 0 });
  });
});
