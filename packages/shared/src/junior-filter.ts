import { JUNIOR_FILTER } from './config';
import type { ExperienceLevel } from './constants';

/**
 * Filtre junior (CLAUDE.md §4.5), fonction pure testée. Écarte les offres trop expérimentées
 * selon le niveau du profil (ou de l'automatisation). « manager » et « responsable » ne sont PAS
 * des mots d'exclusion. Les offres explicitement alternance/stage/junior ne sont jamais écartées.
 */
export interface JuniorFilterInput {
  title: string;
  description?: string;
  /** Champ structuré d'expérience exigée (texte), si présent. */
  experienceRequired?: string | null;
}

export interface JuniorFilterResult {
  kept: boolean;
  /** Raison de l'exclusion (pour l'entonnoir des automatisations). */
  reason?: string;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Années d'expérience exigées détectées dans un texte (0 si rien de clair). */
export function detectRequiredYears(text: string): number {
  const n = normalize(text);
  if (!/exp[eé]?rience|exp\b|ans d/.test(n) && !/\bans?\b/.test(n)) return 0;
  let max = 0;
  // Motifs : « 5 ans d'expérience », « expérience de 3 ans », « 3 ans minimum ».
  const regexes = [
    /(\d+)\s*ans?\s*(?:minimum|min|d['e ]?\s*exp|d['e]exp)/g,
    /exp[eé]rience\s*(?:de\s*)?(\d+)\s*ans?/g,
    /(\d+)\s*ans?\s+d['e]/g,
  ];
  for (const re of regexes) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(n)) !== null) {
      const years = Number(m[1]);
      if (Number.isFinite(years)) max = Math.max(max, years);
    }
  }
  return max;
}

export function passesJuniorFilter(
  offer: JuniorFilterInput,
  level: ExperienceLevel,
): JuniorFilterResult {
  const threshold = JUNIOR_FILTER.maxYearsByLevel[level];
  if (threshold === null) return { kept: true }; // plus de 3 ans → filtre désactivé

  const title = normalize(offer.title);

  // Exceptions : jamais écartée si le titre est clairement junior.
  if (JUNIOR_FILTER.neverExcludeTitleWords.some((w) => title.includes(normalize(w)))) {
    return { kept: true };
  }

  const strict = level === 'debutant' || level === 'moins_1_an';
  const titleWords = [
    ...JUNIOR_FILTER.excludingTitleWords,
    ...(strict ? JUNIOR_FILTER.excludingTitleWordsStrict : []),
  ];
  const hit = titleWords.find((w) => title.includes(normalize(w)));
  if (hit) return { kept: false, reason: `titre « ${hit} »` };

  // Expérience exigée (champ structuré puis texte).
  const sources = [offer.experienceRequired ?? '', offer.description ?? ''];
  for (const src of sources) {
    const years = detectRequiredYears(src);
    if (years > threshold) {
      return { kept: false, reason: `${years} ans d'expérience exigés` };
    }
  }
  return { kept: true };
}
