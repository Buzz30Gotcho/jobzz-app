/**
 * Cœur « pur » de la facturation (CLAUDE.md §2.1). Décrit les offres, le mode Stripe Checkout
 * de chacune, et le calcul des dates de droits Premium (cumul du Pass 3 mois).
 *
 * Aucune dépendance au SDK Stripe ni à la base : tout est testable sans réseau.
 */
import { PRICING } from './config';
import type { SubscriptionOffer } from './constants';

/** Mode Stripe Checkout : abonnement récurrent ou paiement unique. */
export type CheckoutMode = 'subscription' | 'payment';

export interface BillingOfferInfo {
  offer: SubscriptionOffer;
  label: string;
  /** Prix en euros (depuis la configuration). */
  priceEur: number;
  mode: CheckoutMode;
  /** Renouvelé automatiquement (abonnement) ou non (Pass). */
  recurring: boolean;
  description: string;
}

/** Métadonnées des offres payantes, dérivées de la configuration `PRICING`. */
export const BILLING_OFFERS: Record<SubscriptionOffer, BillingOfferInfo> = {
  monthly: {
    offer: 'monthly',
    label: 'Premium mensuel',
    priceEur: PRICING.monthly,
    mode: 'subscription',
    recurring: true,
    description: 'Sans engagement, résiliable à tout moment.',
  },
  launch: {
    offer: 'launch',
    label: 'Offre de lancement',
    priceEur: PRICING.launch,
    mode: 'subscription',
    recurring: true,
    description: `Tarif à vie réservé aux ${PRICING.launchSeats} premiers abonnés Premium.`,
  },
  pass_3_months: {
    offer: 'pass_3_months',
    label: 'Pass 3 mois',
    priceEur: PRICING.pass3Months,
    mode: 'payment',
    recurring: false,
    description: 'Payé en une fois, sans renouvellement automatique.',
  },
};

/** Mode Stripe Checkout pour une offre. */
export function checkoutModeFor(offer: SubscriptionOffer): CheckoutMode {
  return BILLING_OFFERS[offer].mode;
}

/**
 * Ajoute `months` mois à une date, en bornant le jour pour éviter tout débordement de mois.
 * Calcul en **UTC** : déterministe quelle que soit la zone de la machine et insensible aux
 * changements d'heure (une date stockée est un instant UTC, cf. CLAUDE.md §7).
 */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const targetMonth = result.getUTCMonth() + months;
  const expectedMonth = ((targetMonth % 12) + 12) % 12;
  result.setUTCMonth(targetMonth);
  // Débordement (ex. 31 janvier + 1 mois → 3 mars) : on recule au dernier jour du mois visé.
  if (result.getUTCMonth() !== expectedMonth) {
    result.setUTCDate(0);
  }
  return result;
}

/**
 * Nouvelle date de fin des droits Premium après l'achat d'un Pass (paiement unique).
 * Si l'utilisateur a déjà des droits Premium dans le futur, le Pass s'y **ajoute** (cumul) ;
 * sinon il part de maintenant. (CLAUDE.md §2.1 : « Un Pass acheté pendant un Premium déjà actif
 * s'ajoute à la date de fin. »)
 */
export function computePassPremiumUntil(
  now: Date,
  currentPremiumUntil: Date | null | undefined,
  months: number = PRICING.passDurationMonths,
): Date {
  const hasFutureRights =
    currentPremiumUntil != null && currentPremiumUntil.getTime() > now.getTime();
  const base = hasFutureRights ? (currentPremiumUntil as Date) : now;
  return addMonths(base, months);
}

/** Vue d'ensemble de la facturation (pages Tarifs, Mon abonnement, Bienvenue en Premium). */
export interface BillingOverview {
  stripeConfigured: boolean;
  planEnforcement: boolean;
  plan: 'free' | 'premium';
  premiumUntil: string | null;
  isPremium: boolean;
  launchSeatsRemaining: number;
  offers: BillingOfferInfo[];
}

/** Détail de l'abonnement courant pour « Mon abonnement ». */
export interface SubscriptionInfo {
  offer: SubscriptionOffer | null;
  recurring: boolean;
  status: string | null;
  renewsOrEndsAt: string | null;
  canManage: boolean;
}

/** Les droits Premium sont-ils encore valides à l'instant `now` ? */
export function isPremiumActive(
  plan: 'free' | 'premium',
  premiumUntil: Date | null | undefined,
  now: Date,
): boolean {
  if (plan !== 'premium') return false;
  if (premiumUntil == null) return true; // abonnement récurrent sans date de fin connue
  return premiumUntil.getTime() > now.getTime();
}
