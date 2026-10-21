/**
 * Exercice 04 — Isoler les données non fiables dans un prompt IA.
 * Inspiré de : apps/api/src/ai/prompts/message.ts (CLAUDE.md §5, sécurité des prompts).
 *
 * Idée : le texte venant d'une offre, d'un CV ou saisi par l'utilisateur est une DONNÉE, jamais
 * une instruction. On l'enferme dans des balises <donnees> </donnees> pour que le prompt système
 * puisse dire à l'IA de ne jamais exécuter ce qui s'y trouve.
 *
 * Écris `wrapUntrusted(fields)` qui rend exactement :
 *
 *   <donnees>
 *   cle1: valeur1
 *   cle2: valeur2
 *   </donnees>
 *
 * Règles :
 *  - une ligne « cle: valeur » par entrée, dans l'ordre de l'objet ;
 *  - on ignore les valeurs vides ou absentes (undefined) ;
 *  - une valeur contenant un retour à la ligne est mise sur une seule ligne (remplace \n par un espace),
 *    pour qu'elle ne puisse pas fermer la balise ni injecter de fausses lignes.
 */
export function wrapUntrusted(fields: Record<string, string | undefined>): string {
  // TODO : construis le bloc <donnees> ... </donnees> selon les règles ci-dessus.
  throw new Error('Pas encore implémenté');
}
