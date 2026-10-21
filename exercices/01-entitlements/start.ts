/**
 * Exercice 01 — Droits (entitlements).
 * Version de référence : packages/shared/src/entitlements.ts (ne la regarde qu'à la fin !).
 *
 * Objectif : implémenter deux fonctions pures qui décident si une fonctionnalité est autorisée
 * et quelle est sa limite, selon le plan de l'utilisateur, son rôle, et l'état de PLAN_ENFORCEMENT.
 *
 * Règles :
 *  - Si `planEnforcement` est faux → tout le monde est illimité (comme Premium), quel que soit le plan.
 *  - Si le rôle est `admin` → toujours illimité.
 *  - Sinon, la limite dépend du plan (`free` ou `premium`) et de la définition de la fonctionnalité.
 *    Une limite `null` = illimité ; `0` = interdit ; `> 0` = plafond par période.
 *  - `canConsume` : à partir d'une limite résolue et d'un compteur déjà consommé, dit si une
 *    utilisation de plus est permise et combien il en reste (`remaining`).
 *    Pour une limite illimitée (`null`), `remaining` vaut `null`.
 */

export type UsagePeriod = 'day' | 'week' | 'month' | 'none';
export type Plan = 'free' | 'premium';
export type Role = 'user' | 'admin' | 'support';

export interface EntitlementLimit {
  allowed: boolean;
  limit: number | null;
  period: UsagePeriod;
}

interface FeatureDefinition {
  period: UsagePeriod;
  free: number | null;
  premium: number | null;
}

/** Données fournies (tu n'as pas à les modifier) : quelques fonctionnalités d'exemple. */
export const DEFINITIONS: Record<string, FeatureDefinition> = {
  offers_viewed: { period: 'day', free: 25, premium: null },
  ai_message: { period: 'day', free: 0, premium: 30 },
  active_automations: { period: 'none', free: 1, premium: 5 },
};

export function resolveLimit(
  feature: string,
  options: { plan: Plan; role: Role; planEnforcement: boolean },
): EntitlementLimit {
  // TODO : implémente la résolution selon les règles ci-dessus.
  throw new Error('Pas encore implémenté');
}

export function canConsume(
  resolved: EntitlementLimit,
  currentCount: number,
): { allowed: boolean; remaining: number | null } {
  // TODO : implémente la décision d'utilisation.
  throw new Error('Pas encore implémenté');
}
