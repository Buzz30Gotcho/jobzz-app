/**
 * Normalisation d'une adresse email — SOURCE UNIQUE (CLAUDE.md §4.1).
 *
 * Espaces du début et de la fin retirés, puis tout en minuscules. Appliquée partout :
 * à la validation (schémas Zod) et avant chaque enregistrement ou recherche en base, pour
 * que « Fred@Gmail.com » et « fred@gmail.com » désignent toujours le même compte.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
