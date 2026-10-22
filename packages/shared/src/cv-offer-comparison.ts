/**
 * Comparaison CV ↔ offre par règles (CLAUDE.md §4.8). Fonction pure, testée, sans IA.
 * Pour chaque compétence demandée par l'offre : présente dans le CV, dans le profil mais absente
 * du CV, ou absente. Plus les mots-clés importants du titre absents du CV, et 2 ou 3 conseils.
 */

import { normalizeSkill, sameSkillFamily } from './data/skill-families';
import type { CvOfferAiAdvice } from './schemas/ai';

export type SkillPresence = 'in_cv' | 'in_profile_not_cv' | 'absent';

export interface CvOfferSkill {
  skill: string;
  presence: SkillPresence;
}

export interface CvOfferComparison {
  /** Une entrée par compétence demandée par l'offre. */
  skills: CvOfferSkill[];
  /** Mots importants du titre de l'offre absents du CV. */
  missingKeywords: string[];
  /** 2 ou 3 conseils concrets, du plus utile au moins utile. */
  advice: string[];
}

/** Résultat renvoyé au front : comparaison par règles + conseils IA (Premium). */
export interface CvOfferComparisonResult {
  rules: CvOfferComparison;
  ai: CvOfferAiAdvice | null;
}

const TITLE_STOPWORDS = new Set([
  'de',
  'du',
  'des',
  'le',
  'la',
  'les',
  'en',
  'et',
  'un',
  'une',
  'sur',
  'pour',
  'avec',
  'chez',
  'junior',
  'senior',
  'alternance',
  'stage',
  'stagiaire',
  'apprenti',
  'apprentissage',
  'cdi',
  'cdd',
  'hf',
  'fh',
]);

function cvHasSkill(normalizedCv: string, skill: string): boolean {
  return normalizedCv.includes(normalizeSkill(skill));
}

function profileHasSkill(profileSkills: string[], skill: string): boolean {
  const n = normalizeSkill(skill);
  return profileSkills.some((p) => normalizeSkill(p) === n || sameSkillFamily(p, skill));
}

/** Mots significatifs (≥ 4 lettres, hors mots vides) d'un titre d'offre, sans accents. */
function titleKeywords(title: string): string[] {
  const words = normalizeSkill(title)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4 && !TITLE_STOPWORDS.has(w));
  return [...new Set(words)];
}

export function compareCvToOffer(
  cvText: string,
  offer: { title: string; skills: string[] },
  profileSkills: string[],
): CvOfferComparison {
  const normalizedCv = normalizeSkill(cvText);

  const skills: CvOfferSkill[] = offer.skills.map((skill) => {
    let presence: SkillPresence;
    if (cvHasSkill(normalizedCv, skill)) presence = 'in_cv';
    else if (profileHasSkill(profileSkills, skill)) presence = 'in_profile_not_cv';
    else presence = 'absent';
    return { skill, presence };
  });

  const missingKeywords = titleKeywords(offer.title).filter((k) => !normalizedCv.includes(k));

  const inProfileNotCv = skills.filter((s) => s.presence === 'in_profile_not_cv').map((s) => s.skill);
  const absent = skills.filter((s) => s.presence === 'absent').map((s) => s.skill);

  const advice: string[] = [];
  if (inProfileNotCv.length > 0) {
    advice.push(
      `Tu as déjà ${inProfileNotCv.slice(0, 3).join(', ')} dans ton profil : ajoute-les à la section Compétences de ton CV.`,
    );
  }
  if (missingKeywords.length > 0) {
    advice.push(
      `Reprends les termes de l’offre dans ton CV : ${missingKeywords.slice(0, 3).join(', ')}.`,
    );
  }
  if (absent.length > 0) {
    advice.push(
      `Ces compétences sont demandées et n’apparaissent pas : ${absent.slice(0, 3).join(', ')}. Mentionne-les si tu les maîtrises.`,
    );
  }

  return { skills, missingKeywords, advice: advice.slice(0, 3) };
}
