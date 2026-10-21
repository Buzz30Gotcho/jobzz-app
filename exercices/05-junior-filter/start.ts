/**
 * Exercice 05 — Filtre junior.
 * Version de référence : packages/shared/src/junior-filter.ts (ne la regarde qu'à la fin !).
 *
 * Objectif : décider si une offre est gardée pour un profil junior, selon son titre.
 *
 * Règles (simplifiées) :
 *  - comparaison sans accents ni casse ;
 *  - si le titre contient « alternance », « stage » ou « junior » → TOUJOURS gardée ;
 *  - sinon, si le titre contient « senior », « lead » ou « directeur » → écartée ;
 *  - « manager » et « responsable » ne sont PAS des mots d'exclusion ;
 *  - sinon → gardée.
 */
export const EXCLUDING = ['senior', 'lead', 'directeur'];
export const NEVER_EXCLUDE = ['alternance', 'stage', 'junior'];

export function passesJuniorFilter(title: string): boolean {
  // TODO : implémente la décision selon les règles ci-dessus.
  throw new Error('Pas encore implémenté');
}
