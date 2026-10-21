/**
 * Familles de compétences (CLAUDE.md §4.7) : sert au score (identique = 1, même famille = 0,5,
 * générique = 0,25). Fichier de données facile à compléter. Comparaison sans accents ni casse.
 */

export const SKILL_FAMILIES: string[][] = [
  ['javascript', 'typescript', 'node', 'nodejs', 'node.js'],
  ['react', 'angular', 'vue', 'svelte'],
  ['java', 'kotlin', 'spring'],
  ['python', 'django', 'flask'],
  ['sql', 'postgresql', 'postgres', 'mysql', 'mariadb', 'oracle'],
  ['docker', 'kubernetes', 'k8s'],
  ['photoshop', 'illustrator', 'indesign', 'figma', 'sketch'],
  ['excel', 'tableur', 'google sheets'],
  ['seo', 'sea', 'referencement'],
  ['vente', 'prospection', 'negociation', 'relation client'],
  ['recrutement', 'sourcing', 'onboarding'],
];

/** Compétences génériques (peu discriminantes) : comptent pour un quart au score. */
export const GENERIC_SKILL_KEYS = [
  'pack office',
  'office',
  'word',
  'powerpoint',
  'anglais',
  'francais',
  'travail en equipe',
  'autonomie',
  'organisation',
  'rigueur',
  'communication',
];

export function normalizeSkill(skill: string): string {
  return skill
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function isGenericSkill(skill: string): boolean {
  return GENERIC_SKILL_KEYS.includes(normalizeSkill(skill));
}

/** Deux compétences appartiennent-elles à la même famille ? */
export function sameSkillFamily(a: string, b: string): boolean {
  const na = normalizeSkill(a);
  const nb = normalizeSkill(b);
  if (na === nb) return true;
  return SKILL_FAMILIES.some((family) => family.includes(na) && family.includes(nb));
}

/**
 * Score de correspondance d'UNE compétence demandée par l'offre face aux compétences du profil :
 * 1 = identique présente, 0,5 = même famille présente, 0,25 = compétence générique, 0 sinon.
 */
export function skillMatchScore(offerSkill: string, profileSkills: string[]): number {
  const offer = normalizeSkill(offerSkill);
  const profile = profileSkills.map(normalizeSkill);
  if (profile.includes(offer)) return 1;
  if (profileSkills.some((p) => sameSkillFamily(offerSkill, p))) return 0.5;
  if (isGenericSkill(offerSkill)) return 0.25;
  return 0;
}
