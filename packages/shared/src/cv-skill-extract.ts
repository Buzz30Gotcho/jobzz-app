/**
 * Extraction de compétences d'un CV par règles (CLAUDE.md §4.8 : « extraction depuis le CV »,
 * règles + IA). Fonction pure testée : on cherche, dans le texte du CV, les compétences connues
 * du vocabulaire (compétences courantes par domaine), et on renvoie leurs libellés canoniques.
 */

import { SKILL_DOMAINS } from './data/skill-suggestions';
import { normalizeSkill } from './data/skill-families';

/** Vocabulaire des libellés canoniques (dédupliqués) issus des domaines de compétences. */
function vocabulary(): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const domain of SKILL_DOMAINS) {
    for (const skill of domain.skills) {
      const key = normalizeSkill(skill);
      if (!seen.has(key)) {
        seen.add(key);
        labels.push(skill);
      }
    }
  }
  return labels;
}

/**
 * Renvoie les compétences connues présentes dans le texte du CV (libellés canoniques), au plus
 * `max`. Comparaison sans accents ni casse ; « HTML/CSS » est trouvé si « html » ou « css » apparaît.
 */
/** Mots vides ignorés dans les libellés composites (« Travail en équipe »). */
const STOPWORDS = new Set(['en', 'et', 'de', 'du', 'des', 'la', 'le', 'les', 'un', 'une', 'avec', 'sur']);

/** Jetons (mots) d'un texte, sans ponctuation de bord (« sql. » → « sql », « node.js » conservé). */
function tokenize(text: string): string[] {
  return normalizeSkill(text)
    .split(/[^a-z0-9.+#]+/)
    .map((t) => t.replace(/^[.]+|[.]+$/g, ''))
    .filter(Boolean);
}

export function extractSkillsFromCv(cvText: string, max = 20): string[] {
  // On compare par mot entier, jamais par sous-chaîne (sinon « rest » matcherait « restauration »).
  const tokens = new Set(tokenize(cvText));
  const found: string[] = [];
  for (const label of vocabulary()) {
    // Un libellé composite (« HTML/CSS », « API REST ») est présent si l'un de ses termes l'est.
    const terms = tokenize(label).filter((t) => t.length >= 2 && !STOPWORDS.has(t));
    if (terms.some((t) => tokens.has(t))) found.push(label);
    if (found.length >= max) break;
  }
  return found;
}
