import { describe, expect, it } from 'vitest';
import { isoWeekdayParis } from '../common/time';
import { computeNextFollowUpAt } from './follow-up-rule';

describe('computeNextFollowUpAt', () => {
  it('ajoute 7 jours quand l\'échéance tombe en semaine', () => {
    // Mardi 6 octobre 2026 → +7 jours = mardi 13 octobre.
    const applied = new Date('2026-10-06T09:00:00Z');
    const due = computeNextFollowUpAt(applied);
    expect(due.toISOString().slice(0, 10)).toBe('2026-10-13');
    expect(isoWeekdayParis(due)).toBeLessThanOrEqual(5);
  });

  it('décale au lundi si l\'échéance tombe un samedi', () => {
    // Samedi 10 octobre 2026 : candidature le 3 octobre (samedi) + 7 = samedi 10 → lundi 12.
    const applied = new Date('2026-10-03T09:00:00Z');
    const due = computeNextFollowUpAt(applied);
    expect(isoWeekdayParis(due)).toBe(1); // lundi
    expect(due.toISOString().slice(0, 10)).toBe('2026-10-12');
  });

  it('décale au lundi si l\'échéance tombe un dimanche', () => {
    // Dimanche 11 octobre 2026 : candidature le 4 octobre (dimanche) + 7 = dimanche 11 → lundi 12.
    const applied = new Date('2026-10-04T09:00:00Z');
    const due = computeNextFollowUpAt(applied);
    expect(isoWeekdayParis(due)).toBe(1);
    expect(due.toISOString().slice(0, 10)).toBe('2026-10-12');
  });
});
