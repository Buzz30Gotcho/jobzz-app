/**
 * Exercice 03 — Rendu d'un modèle de message.
 * Version de référence : packages/shared/src/data/message-templates.ts (ne la regarde qu'à la fin !).
 *
 * Objectif : remplacer dans un texte les variables écrites entre accolades, comme {prenom} ou
 * {entreprise}, par leur valeur. Une variable inconnue (absente de `vars`) devient une chaîne vide.
 *
 * Exemples :
 *   renderTemplate('Bonjour {prenom}', { prenom: 'Fred' })      === 'Bonjour Fred'
 *   renderTemplate('Chez {entreprise}', {})                      === 'Chez '
 *   renderTemplate('{a} et {b}', { a: '1', b: '2' })             === '1 et 2'
 *
 * Astuce : une expression régulière `/\{(\w+)\}/g` capture le nom de chaque variable.
 */

export type TemplateVars = Record<string, string | undefined>;

export function renderTemplate(template: string, vars: TemplateVars): string {
  // TODO : remplace chaque {variable} par sa valeur (vide si absente).
  throw new Error('Pas encore implémenté');
}
