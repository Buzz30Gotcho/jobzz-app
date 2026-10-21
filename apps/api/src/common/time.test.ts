import { describe, expect, it } from 'vitest';
import {
  isoWeekdayParis,
  startOfDayParis,
  startOfMonthParis,
  startOfWeekParis,
} from './time';

describe('startOfDayParis', () => {
  it('gère l’heure d’hiver (UTC+1) : minuit Paris = 23:00 UTC la veille', () => {
    // 15 janvier 2026, 10:00 UTC
    const d = new Date('2026-01-15T10:00:00Z');
    expect(startOfDayParis(d).toISOString()).toBe('2026-01-14T23:00:00.000Z');
  });

  it('gère l’heure d’été (UTC+2) : minuit Paris = 22:00 UTC la veille', () => {
    // 15 juillet 2026, 10:00 UTC
    const d = new Date('2026-07-15T10:00:00Z');
    expect(startOfDayParis(d).toISOString()).toBe('2026-07-14T22:00:00.000Z');
  });

  it('reste stable juste après minuit heure de Paris', () => {
    // 01:30 Paris en été = 23:30 UTC la veille
    const d = new Date('2026-07-14T23:30:00Z');
    expect(startOfDayParis(d).toISOString()).toBe('2026-07-14T22:00:00.000Z');
  });
});

describe('isoWeekdayParis', () => {
  it('rend 1 pour un lundi et 7 pour un dimanche', () => {
    expect(isoWeekdayParis(new Date('2026-10-19T12:00:00Z'))).toBe(1); // lundi
    expect(isoWeekdayParis(new Date('2026-10-25T12:00:00Z'))).toBe(7); // dimanche
  });
});

describe('startOfWeekParis', () => {
  it('ramène au lundi minuit (Paris) de la semaine', () => {
    // mercredi 21 octobre 2026 → lundi 19 octobre, minuit Paris (UTC+2)
    const d = new Date('2026-10-21T15:00:00Z');
    expect(startOfWeekParis(d).toISOString()).toBe('2026-10-18T22:00:00.000Z');
  });
});

describe('startOfMonthParis', () => {
  it('ramène au 1er du mois, minuit Paris', () => {
    const d = new Date('2026-01-20T10:00:00Z');
    expect(startOfMonthParis(d).toISOString()).toBe('2025-12-31T23:00:00.000Z');
  });
});
