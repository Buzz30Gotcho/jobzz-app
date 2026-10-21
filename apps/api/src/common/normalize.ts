/**
 * Normalisation pour les clés de doublon (entreprise, poste) : minuscules, sans accents,
 * sans ponctuation, sans formes juridiques courantes (SAS, SARL…). Cf. CLAUDE.md §4.3.
 */
const LEGAL_FORMS = ['sas', 'sasu', 'sarl', 'eurl', 'sa', 'sci', 'snc', 'scop', 'gie'];

export function normalizeKey(input: string): string {
  const base = input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // enlève les accents (diacritiques combinés)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // ponctuation → espace
    .replace(/\s+/g, ' ')
    .trim();

  const words = base.split(' ').filter((w) => w.length > 0 && !LEGAL_FORMS.includes(w));
  return words.join(' ');
}
