/**
 * Cœur « pur » des droits (entitlements) : à partir d'un plan et de l'état de PLAN_ENFORCEMENT,
 * dit si une fonctionnalité est autorisée et quelle est sa limite par période.
 *
 * Ces fonctions sont sans effet de bord et entièrement testées. Le module NestJS `entitlements`
 * s'appuie dessus et y ajoute le comptage persistant (UsageCounter) et l'accès à la base.
 */
import { FREE_LIMITS, PREMIUM_LIMITS } from './config';
import type { Feature, Plan, Role } from './constants';

/** Fenêtre de remise à zéro d'un compteur d'usage. */
export type UsagePeriod = 'day' | 'week' | 'month' | 'none';

/** Résultat de la résolution d'une limite. `limit: null` = illimité. */
export interface EntitlementLimit {
  allowed: boolean;
  limit: number | null;
  period: UsagePeriod;
}

interface FeatureDefinition {
  period: UsagePeriod;
  /** Limite en plan gratuit (`null` = illimité, `0` = interdit). */
  free: number | null;
  /** Limite en plan premium (`null` = illimité, `0` = interdit). */
  premium: number | null;
}

const DEFINITIONS: Record<Feature, FeatureDefinition> = {
  offers_viewed: { period: 'day', free: FREE_LIMITS.offersViewedPerDay, premium: null },
  free_send: { period: 'week', free: FREE_LIMITS.freeSendsPerWeek, premium: null },
  ai_message: { period: 'day', free: 0, premium: PREMIUM_LIMITS.aiMessagesPerDay },
  cv_rules_analysis: { period: 'month', free: FREE_LIMITS.cvRulesAnalysisPerMonth, premium: null },
  cv_ai_analysis: { period: 'day', free: 0, premium: PREMIUM_LIMITS.cvAiAnalysisPerDay },
  cv_offer_comparison: {
    period: 'day',
    free: FREE_LIMITS.cvOfferComparisonPerDay,
    premium: null,
  },
  cv_offer_ai_advice: { period: 'day', free: 0, premium: PREMIUM_LIMITS.cvOfferAiAdvicePerDay },
  active_automations: {
    period: 'none',
    free: FREE_LIMITS.activeAutomations,
    premium: PREMIUM_LIMITS.activeAutomations,
  },
};

/** Le rôle a-t-il tous les droits sans limite ? (admin : voir CLAUDE.md §4.11.) */
export function hasUnlimitedRole(role: Role): boolean {
  return role === 'admin';
}

/**
 * Résout la limite d'une fonctionnalité.
 * - Si `planEnforcement` est faux (défaut local), tout le monde est traité comme Premium
 *   sans aucune limite.
 * - L'admin a toujours tout, sans limite.
 */
export function resolveLimit(
  feature: Feature,
  options: { plan: Plan; role: Role; planEnforcement: boolean },
): EntitlementLimit {
  const def = DEFINITIONS[feature];

  if (!options.planEnforcement || hasUnlimitedRole(options.role)) {
    return { allowed: true, limit: null, period: def.period };
  }

  const limit = options.plan === 'premium' ? def.premium : def.free;
  return { allowed: limit === null || limit > 0, limit, period: def.period };
}

/**
 * À partir d'une limite résolue et d'un compteur déjà consommé, dit si une utilisation
 * supplémentaire est permise et combien il reste.
 */
export function canConsume(
  resolved: EntitlementLimit,
  currentCount: number,
): { allowed: boolean; remaining: number | null } {
  if (resolved.limit === null) {
    return { allowed: resolved.allowed, remaining: null };
  }
  const remaining = Math.max(0, resolved.limit - currentCount);
  return { allowed: resolved.allowed && remaining > 0, remaining };
}
