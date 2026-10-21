/**
 * Exercice 06 — Texte de recherche pour les alertes externes.
 * Version de référence : packages/shared/src/alert-helpers.ts (ne la regarde qu'à la fin !).
 *
 * Objectif : construire le texte de recherche à coller sur un site d'offres, selon qu'il gère ou
 * non les opérateurs (guillemets, OR, -).
 *
 * Règles :
 *  - on commence par le mot du contrat s'il est fourni (« alternance », « CDI »…) ;
 *  - si le site gère les opérateurs :
 *      • les métiers deviennent ("m1" OR "m2" OR ...) ;
 *      • chaque mot à exclure devient -mot (ou -"deux mots" s'il contient une espace) ;
 *  - sinon : on met seulement le mot du contrat + le PREMIER métier (pas d'opérateurs) ;
 *  - on ignore les métiers vides ; on renvoie une chaîne sans espaces superflus.
 */
export interface AlertSpec {
  metiers: string[];
  contractWord?: string;
  excludeWords: string[];
}

export function buildAlertQuery(spec: AlertSpec, supportsOperators: boolean): string {
  // TODO : construis le texte selon les règles ci-dessus.
  throw new Error('Pas encore implémenté');
}
