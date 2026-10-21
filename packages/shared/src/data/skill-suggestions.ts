/**
 * Suggestions de compétences par grand domaine (CLAUDE.md §4.2 : « suggestions en un clic
 * selon le métier », tous secteurs). Fichier de données **facile à compléter** : pour ajouter
 * un domaine, ajoute une entrée avec ses mots-clés (déclencheurs) et ses compétences courantes.
 *
 * La reconnaissance est volontairement simple et déterministe (pas d'IA) : on compare le libellé
 * du métier, en minuscules et sans accents, aux mots-clés de chaque domaine.
 */

export interface SkillDomain {
  /** Identifiant du domaine. */
  id: string;
  /** Mots-clés déclencheurs (minuscules, sans accents) cherchés dans le libellé du métier. */
  keywords: string[];
  /** Compétences courantes proposées en un clic. */
  skills: string[];
}

export const SKILL_DOMAINS: SkillDomain[] = [
  {
    id: 'dev',
    keywords: ['developpeur', 'developpeuse', 'developpement', 'informatique', 'logiciel', 'web', 'data', 'devops', 'back', 'front', 'fullstack'],
    skills: ['JavaScript', 'TypeScript', 'Python', 'Java', 'SQL', 'Git', 'React', 'Angular', 'Node.js', 'Docker', 'HTML/CSS', 'API REST'],
  },
  {
    id: 'commerce',
    keywords: ['commercial', 'commerciale', 'vente', 'vendeur', 'vendeuse', 'business', 'account', 'commerce'],
    skills: ['Prospection', 'Négociation', 'Relation client', 'CRM', 'Vente B2B', 'Vente B2C', 'Argumentation', 'Suivi de portefeuille'],
  },
  {
    id: 'marketing',
    keywords: ['marketing', 'communication', 'community', 'digital', 'content', 'social media', 'growth'],
    skills: ['Réseaux sociaux', 'Rédaction web', 'SEO', 'Google Analytics', 'Canva', 'Emailing', 'Community management', 'Stratégie de contenu'],
  },
  {
    id: 'rh',
    keywords: ['rh', 'ressources humaines', 'recrutement', 'recruteur', 'paie', 'talent'],
    skills: ['Recrutement', 'Sourcing', 'Gestion de la paie', 'Droit du travail', 'Entretiens', 'SIRH', 'Onboarding', 'Formation'],
  },
  {
    id: 'sante',
    keywords: ['sante', 'infirmier', 'infirmiere', 'aide-soignant', 'medical', 'soin', 'pharmacie'],
    skills: ['Soins', "Relation avec les patients", 'Hygiène', 'Travail en équipe', 'Gestes d\'urgence', 'Dossier médical', 'Écoute'],
  },
  {
    id: 'btp',
    keywords: ['btp', 'batiment', 'chantier', 'macon', 'travaux', 'genie civil', 'conducteur de travaux'],
    skills: ['Lecture de plans', 'Sécurité chantier', 'Maçonnerie', 'Conduite de travaux', 'Métré', 'AutoCAD', 'Coordination'],
  },
  {
    id: 'compta',
    keywords: ['comptable', 'comptabilite', 'finance', 'gestion', 'audit', 'controle de gestion'],
    skills: ['Comptabilité générale', 'Excel', 'Saisie comptable', 'Rapprochement bancaire', 'Déclarations fiscales', 'SAGE', 'Reporting'],
  },
  {
    id: 'design',
    keywords: ['design', 'graphiste', 'ux', 'ui', 'designer', 'motion', 'direction artistique'],
    skills: ['Figma', 'Adobe Photoshop', 'Adobe Illustrator', 'UX design', 'UI design', 'Prototypage', 'Identité visuelle'],
  },
];

/** Compétences génériques proposées à tout le monde (toujours utiles). */
export const GENERIC_SKILLS = ['Pack Office', 'Anglais', 'Travail en équipe', 'Autonomie', 'Organisation'];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Propose des compétences en un clic à partir des libellés de métiers visés.
 * Renvoie les compétences des domaines reconnus (dédoublonnées) + quelques génériques.
 * Si aucun domaine ne correspond, renvoie uniquement les compétences génériques.
 */
export function suggestSkills(jobLabels: string[], max = 16): string[] {
  const haystack = jobLabels.map(normalize).join(' ');
  const matched = SKILL_DOMAINS.filter((domain) =>
    domain.keywords.some((keyword) => haystack.includes(keyword)),
  );

  const result: string[] = [];
  const seen = new Set<string>();
  const push = (skill: string) => {
    const key = normalize(skill);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(skill);
    }
  };

  for (const domain of matched) domain.skills.forEach(push);
  GENERIC_SKILLS.forEach(push);

  return result.slice(0, max);
}
