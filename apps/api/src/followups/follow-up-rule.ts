import { FOLLOW_UP } from '@jobzz/shared';
import { isoWeekdayParis } from '../common/time';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Échéance de relance (CLAUDE.md §4.3) : une candidature `en_attente` apparaît dans « À buzzer »
 * `FOLLOW_UP.delayDays` jours après la candidature. Si l'échéance tombe un samedi ou un dimanche,
 * elle est **décalée au lundi**. Fonction pure, testée (week-ends inclus).
 */
export function computeNextFollowUpAt(appliedAt: Date): Date {
  let due = new Date(appliedAt.getTime() + FOLLOW_UP.delayDays * DAY_MS);

  if (FOLLOW_UP.shiftWeekendToMonday) {
    // 6 = samedi, 7 = dimanche (jour de la semaine à Paris).
    let weekday = isoWeekdayParis(due);
    while (weekday === 6 || weekday === 7) {
      due = new Date(due.getTime() + DAY_MS);
      weekday = isoWeekdayParis(due);
    }
  }
  return due;
}
