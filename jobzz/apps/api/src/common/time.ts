import { BUSINESS_TIMEZONE, type UsagePeriod } from '@jobzz/shared';

/**
 * Utilitaires de temps : les dates sont stockées en UTC, mais les règles métier (remise à
 * zéro des compteurs, week-ends, heures calmes, échéances) se calculent en Europe/Paris
 * (cf. CLAUDE.md §7). Ces fonctions font la conversion sans dépendance externe.
 */

interface WallClock {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/** Composantes « horloge murale » d'un instant, lues dans un fuseau donné. */
export function wallClockInZone(date: Date, timeZone: string = BUSINESS_TIMEZONE): WallClock {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour === '24' ? '0' : parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/** Décalage (ms) du fuseau par rapport à UTC pour l'instant donné. */
function zoneOffsetMs(date: Date, timeZone: string): number {
  const w = wallClockInZone(date, timeZone);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  return asUtc - date.getTime();
}

/** Instant UTC correspondant à une horloge murale dans le fuseau (gère l'heure d'été). */
export function zonedWallClockToUtc(wall: WallClock, timeZone: string = BUSINESS_TIMEZONE): Date {
  const guess = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second);
  const offset = zoneOffsetMs(new Date(guess), timeZone);
  let utc = guess - offset;
  const offset2 = zoneOffsetMs(new Date(utc), timeZone);
  if (offset2 !== offset) {
    utc = guess - offset2;
  }
  return new Date(utc);
}

/** Début du jour (minuit) à Paris, exprimé en instant UTC. */
export function startOfDayParis(date: Date): Date {
  const w = wallClockInZone(date);
  return zonedWallClockToUtc({ ...w, hour: 0, minute: 0, second: 0 });
}

/** Jour de la semaine à Paris (1 = lundi … 7 = dimanche). */
export function isoWeekdayParis(date: Date): number {
  const w = wallClockInZone(date);
  const day = new Date(Date.UTC(w.year, w.month - 1, w.day)).getUTCDay(); // 0 = dimanche
  return day === 0 ? 7 : day;
}

/** Début de la semaine ISO (lundi minuit) à Paris, en instant UTC. */
export function startOfWeekParis(date: Date): Date {
  const start = startOfDayParis(date);
  const weekday = isoWeekdayParis(date); // 1..7
  return new Date(start.getTime() - (weekday - 1) * 24 * 60 * 60 * 1000);
}

/** Début du mois (1er à minuit) à Paris, en instant UTC. */
export function startOfMonthParis(date: Date): Date {
  const w = wallClockInZone(date);
  return zonedWallClockToUtc({ ...w, day: 1, hour: 0, minute: 0, second: 0 });
}

/** Début de la période d'un compteur d'usage, selon sa fenêtre. */
export function startOfPeriodParis(period: UsagePeriod, date: Date): Date {
  switch (period) {
    case 'day':
      return startOfDayParis(date);
    case 'week':
      return startOfWeekParis(date);
    case 'month':
      return startOfMonthParis(date);
    case 'none':
      return new Date(0); // compteur unique, jamais remis à zéro
  }
}
