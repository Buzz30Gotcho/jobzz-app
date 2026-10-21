import { OFFER_MAIL, AUTOMATIONS } from '@jobzz/shared';
import { wallClockInZone } from '../common/time';

/**
 * Règles d'envoi du mail des offres (CLAUDE.md §4.6), fonction pure testée.
 * - Premium : dès qu'il y a de nouvelles offres, avec au moins 4 h entre deux mails et aucun envoi
 *   entre 22 h et 7 h (heure de Paris).
 * - Gratuit (automatisation découverte) : un seul mail par semaine, le lundi à 8 h.
 */
export interface SendDecisionInput {
  isPremium: boolean;
  lastMailAt: Date | null;
  now: Date;
  /** Y a-t-il au moins une nouvelle offre à envoyer ? */
  hasNewOffers: boolean;
}

const HOUR_MS = 60 * 60 * 1000;

export function shouldSendDigest(input: SendDecisionInput): boolean {
  if (!input.hasNewOffers) return false;
  const wall = wallClockInZone(input.now);

  if (input.isPremium) {
    // Heures calmes : pas d'envoi entre 22 h et 7 h (Paris).
    if (wall.hour >= OFFER_MAIL.quietHoursStart || wall.hour < OFFER_MAIL.quietHoursEnd) return false;
    // Au moins 4 h depuis le dernier mail.
    if (input.lastMailAt && input.now.getTime() - input.lastMailAt.getTime() < OFFER_MAIL.minHoursBetweenMails * HOUR_MS) {
      return false;
    }
    return true;
  }

  // Gratuit : lundi (1), à l'heure configurée, et pas déjà envoyé dans les ~20 h.
  const isoWeekday = (() => {
    const d = new Date(Date.UTC(wall.year, wall.month - 1, wall.day)).getUTCDay();
    return d === 0 ? 7 : d;
  })();
  if (isoWeekday !== AUTOMATIONS.discoveryWeeklyDay) return false;
  if (wall.hour !== AUTOMATIONS.discoveryWeeklyHour) return false;
  if (input.lastMailAt && input.now.getTime() - input.lastMailAt.getTime() < 20 * HOUR_MS) return false;
  return true;
}
