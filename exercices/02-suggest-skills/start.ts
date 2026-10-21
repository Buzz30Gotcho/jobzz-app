/**
 * Exercice 02 — Suggestions de compétences.
 * Version de référence : packages/shared/src/data/skill-suggestions.ts (ne la regarde qu'à la fin !).
 *
 * Objectif : à partir des libellés de métiers visés, proposer des compétences « en un clic ».
 *
 * Règles :
 *  - La comparaison ignore la casse ET les accents (« Développeur » doit matcher « developpeur »).
 *  - Pour chaque domaine dont un mot-clé apparaît dans l'un des libellés, on ajoute ses compétences.
 *  - On ajoute toujours les compétences génériques à la fin.
 *  - On dédoublonne (insensible à la casse/accents) en gardant le premier libellé rencontré.
 *  - On tronque à `max` éléments.
 *  - Si aucun domaine ne correspond → uniquement les génériques.
 *
 * Astuce normalisation : `text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')`.
 */

export interface SkillDomain {
  id: string;
  keywords: string[];
  skills: string[];
}

// Deux domaines suffisent pour l'exercice (la vraie version en a davantage).
export const DOMAINS: SkillDomain[] = [
  {
    id: 'dev',
    keywords: ['developpeur', 'web', 'informatique'],
    skills: ['JavaScript', 'TypeScript', 'SQL', 'Git'],
  },
  {
    id: 'rh',
    keywords: ['rh', 'recrutement', 'ressources humaines'],
    skills: ['Recrutement', 'Sourcing', 'Droit du travail'],
  },
];

export const GENERIC_SKILLS = ['Pack Office', 'Anglais', 'Travail en équipe'];

export function suggestSkills(jobLabels: string[], max = 16): string[] {
  // TODO : implémente la suggestion selon les règles ci-dessus.
  throw new Error('Pas encore implémenté');
}
