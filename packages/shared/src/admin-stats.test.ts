import { describe, expect, it } from 'vitest';
import {
  averageSubscriptionDurationDays,
  computeTrend,
  summarizeJobOutcomes,
} from './admin-stats';

describe('computeTrend', () => {
  it('calcule une hausse en pourcentage', () => {
    const t = computeTrend(112, 100);
    expect(t.deltaPercent).toBe(12);
    expect(t.direction).toBe('up');
    expect(t.label).toBe('+12 % vs semaine dernière');
  });

  it('calcule une baisse', () => {
    expect(computeTrend(80, 100).deltaPercent).toBe(-20);
    expect(computeTrend(80, 100).label).toBe('-20 % vs semaine dernière');
  });

  it('gère la semaine précédente à zéro', () => {
    expect(computeTrend(5, 0).deltaPercent).toBeNull();
    expect(computeTrend(0, 0).direction).toBe('flat');
  });
});

describe('averageSubscriptionDurationDays', () => {
  it('renvoie null sans période', () => {
    expect(averageSubscriptionDurationDays([])).toBeNull();
  });

  it('moyenne des durées, périodes en cours comptées jusqu’à now', () => {
    const now = new Date('2026-01-31T00:00:00Z');
    const avg = averageSubscriptionDurationDays(
      [
        { startedAt: '2026-01-01T00:00:00Z', endedAt: '2026-01-11T00:00:00Z' }, // 10 j
        { startedAt: '2026-01-01T00:00:00Z', endedAt: null }, // 30 j jusqu'à now
      ],
      now,
    );
    expect(avg).toBe(20);
  });
});

describe('summarizeJobOutcomes', () => {
  it('agrège par contrat et ressenti, ignore les annulés', () => {
    const s = summarizeJobOutcomes([
      { contractType: 'alternance', helpfulness: 'beaucoup', cancelledAt: null },
      { contractType: 'alternance', helpfulness: 'un_peu', cancelledAt: null },
      { contractType: 'cdi', helpfulness: 'beaucoup', cancelledAt: null },
      { contractType: 'stage', helpfulness: null, cancelledAt: '2026-01-01' }, // annulé
    ]);
    expect(s.total).toBe(3);
    expect(s.byContract).toEqual({ alternance: 2, cdi: 1 });
    expect(s.helpfulness).toEqual({ beaucoup: 2, un_peu: 1, pas_vraiment: 0 });
  });
});
