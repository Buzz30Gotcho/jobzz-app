import { describe, expect, it } from 'vitest';
import { canConsume, resolveLimit } from './start';

describe('resolveLimit', () => {
  it('PLAN_ENFORCEMENT=false → illimité pour tout le monde', () => {
    expect(resolveLimit('offers_viewed', { plan: 'free', role: 'user', planEnforcement: false })).toEqual(
      { allowed: true, limit: null, period: 'day' },
    );
  });

  it('gratuit : limite des offres vues à 25 par jour', () => {
    expect(resolveLimit('offers_viewed', { plan: 'free', role: 'user', planEnforcement: true })).toEqual(
      { allowed: true, limit: 25, period: 'day' },
    );
  });

  it('gratuit : messages IA interdits', () => {
    const r = resolveLimit('ai_message', { plan: 'free', role: 'user', planEnforcement: true });
    expect(r.allowed).toBe(false);
    expect(r.limit).toBe(0);
  });

  it('premium : 30 messages IA par jour', () => {
    const r = resolveLimit('ai_message', { plan: 'premium', role: 'user', planEnforcement: true });
    expect(r).toEqual({ allowed: true, limit: 30, period: 'day' });
  });

  it('admin : toujours illimité, même en gratuit', () => {
    expect(resolveLimit('ai_message', { plan: 'free', role: 'admin', planEnforcement: true })).toEqual(
      { allowed: true, limit: null, period: 'day' },
    );
  });
});

describe('canConsume', () => {
  const dayFree = { allowed: true, limit: 25, period: 'day' as const };

  it('autorise sous la limite', () => {
    expect(canConsume(dayFree, 0)).toEqual({ allowed: true, remaining: 25 });
    expect(canConsume(dayFree, 24)).toEqual({ allowed: true, remaining: 1 });
  });

  it('refuse à la limite', () => {
    expect(canConsume(dayFree, 25)).toEqual({ allowed: false, remaining: 0 });
  });

  it('illimité → remaining null', () => {
    expect(canConsume({ allowed: true, limit: null, period: 'day' }, 9999)).toEqual({
      allowed: true,
      remaining: null,
    });
  });

  it('interdit (limite 0) → refusé', () => {
    expect(canConsume({ allowed: false, limit: 0, period: 'day' }, 0)).toEqual({
      allowed: false,
      remaining: 0,
    });
  });
});
