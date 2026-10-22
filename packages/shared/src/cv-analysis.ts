/**
 * Analyse du CV par règles (CLAUDE.md §4.8). Fonction pure, entièrement testée, sans IA.
 * Travaille sur le texte extrait du PDF. Tous métiers : les règles propres au développement et
 * au design (GitHub / portfolio) ne s'ajoutent que pour ces domaines et ne pénalisent pas les autres.
 */

import { normalizeSkill } from './data/skill-families';
import type { CvAiAnalysis } from './schemas/ai';

/** Un conseil d'analyse : ✅ (ok) ou ⚠️ (à améliorer), avec une action concrète facultative. */
export interface CvRulesTip {
  level: 'ok' | 'warn';
  message: string;
  action?: string;
}

export interface CvRulesAnalysis {
  /** Score sur 100 : part des vérifications réussies, pondérée. */
  score: number;
  /** Pages estimées à partir du texte (indicatif). */
  estimatedPages: number;
  /** Conseils, les ⚠️ (à améliorer) d'abord. */
  tips: CvRulesTip[];
}

/** Suggestions d'extraction du profil depuis le CV (règles + IA), à valider par l'utilisateur. */
export interface CvProfileExtract {
  skills: string[];
  jobLabel: string | null;
  city: string | null;
  educationLevel: string | null;
  /** Vrai si l'IA a enrichi l'extraction ; faux si extraction par règles seules. */
  aiUsed: boolean;
}

/** État du CV de l'utilisateur renvoyé au front. */
export interface CvStatus {
  hasCv: boolean;
  uploadedAt: string | null;
  /** Analyse par règles (gratuit). `null` si pas de CV ou non encore analysé. */
  rules: CvRulesAnalysis | null;
  /** Analyse par l'IA (Premium). `null` si pas encore demandée ou IA indisponible. */
  ai: CvAiAnalysis | null;
}

/** Formulations creuses à éviter dans un CV (sans accent, en minuscules). */
const EMPTY_WORDS = [
  'motive',
  'dynamique',
  'curieux',
  'serieux',
  'rigoureux',
  'passionne',
  'polyvalent',
  'autonome',
];

/** Mots-clés indiquant un domaine « tech/design » (déclenche la règle GitHub / portfolio). */
const TECH_DESIGN_HINTS = [
  'developpeur',
  'developpeuse',
  'developpement',
  'web',
  'logiciel',
  'informatique',
  'data',
  'designer',
  'design',
  'graphiste',
  'ux',
  'ui',
  'integrateur',
];

/** En-têtes de sections attendues : chaque entrée liste des variantes (sans accent). */
const SECTIONS: { label: string; keywords: string[] }[] = [
  { label: 'Expériences', keywords: ['experience', 'experiences', 'parcours', 'emploi'] },
  { label: 'Formation', keywords: ['formation', 'formations', 'diplome', 'etudes', 'scolarite'] },
  { label: 'Compétences', keywords: ['competence', 'competences', 'skills'] },
  { label: 'Langues', keywords: ['langue', 'langues', 'anglais'] },
];

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_RE = /(?:\+33|0)\s*[1-9](?:[\s.-]*\d{2}){4}/;
const LINKEDIN_RE = /linkedin\.com\/in\//i;
const YEAR_RE = /\b(19|20)\d{2}\b/;
const NUMBER_RESULT_RE = /\d+\s*(%|k€|k\$|€|\bans?\b|\bmois\b|\bclients?\b|\bventes?\b)/i;

/** Découpe un libellé de métier en mots-clés significatifs (≥ 3 lettres, sans accent). */
export function jobKeywordsFromLabels(labels: string[]): string[] {
  const stop = new Set(['de', 'du', 'des', 'le', 'la', 'les', 'en', 'et', 'un', 'une', 'sur']);
  const words = labels
    .flatMap((label) => normalizeSkill(label).split(/[^a-z0-9]+/))
    .filter((w) => w.length >= 3 && !stop.has(w));
  return [...new Set(words)];
}

/**
 * Analyse le texte d'un CV et renvoie un score et des conseils.
 * @param text texte brut extrait du PDF
 * @param jobKeywords mots-clés du métier visé (voir `jobKeywordsFromLabels`)
 */
export function analyzeCvByRules(text: string, jobKeywords: string[] = []): CvRulesAnalysis {
  const normalized = normalizeSkill(text);
  const words = normalized.split(/\s+/).filter(Boolean);
  const estimatedPages = Math.max(1, Math.ceil(words.length / 500));

  const tips: CvRulesTip[] = [];
  // Chaque vérification : un poids et un booléen « réussie ».
  const checks: { ok: boolean; weight: number; okTip: CvRulesTip; warnTip: CvRulesTip }[] = [];

  // Longueur : 1 page conseillée pour un junior, alerte au-delà de 2.
  checks.push({
    ok: estimatedPages <= 2,
    weight: 1,
    okTip: { level: 'ok', message: `Longueur adaptée (environ ${estimatedPages} page(s)).` },
    warnTip: {
      level: 'warn',
      message: `CV un peu long (environ ${estimatedPages} pages).`,
      action: 'Vise 1 page : garde l’essentiel pour un profil junior.',
    },
  });

  // Sections présentes.
  for (const section of SECTIONS) {
    const present = section.keywords.some((k) => normalized.includes(k));
    checks.push({
      ok: present,
      weight: 1,
      okTip: { level: 'ok', message: `Section « ${section.label} » présente.` },
      warnTip: {
        level: 'warn',
        message: `Section « ${section.label} » introuvable.`,
        action: `Ajoute une section « ${section.label} » clairement intitulée.`,
      },
    });
  }

  // Contact : email + téléphone.
  checks.push({
    ok: EMAIL_RE.test(text),
    weight: 1,
    okTip: { level: 'ok', message: 'Adresse email présente.' },
    warnTip: { level: 'warn', message: 'Aucune adresse email détectée.', action: 'Ajoute un email de contact.' },
  });
  checks.push({
    ok: PHONE_RE.test(text),
    weight: 1,
    okTip: { level: 'ok', message: 'Numéro de téléphone présent.' },
    warnTip: {
      level: 'warn',
      message: 'Aucun numéro de téléphone détecté.',
      action: 'Ajoute un numéro de téléphone.',
    },
  });

  // Lien LinkedIn.
  checks.push({
    ok: LINKEDIN_RE.test(text),
    weight: 1,
    okTip: { level: 'ok', message: 'Lien LinkedIn présent.' },
    warnTip: {
      level: 'warn',
      message: 'Pas de lien LinkedIn.',
      action: 'Ajoute l’URL de ton profil LinkedIn (linkedin.com/in/…).',
    },
  });

  // Dates (années) présentes.
  checks.push({
    ok: YEAR_RE.test(text),
    weight: 1,
    okTip: { level: 'ok', message: 'Dates présentes dans ton parcours.' },
    warnTip: {
      level: 'warn',
      message: 'Aucune date détectée.',
      action: 'Précise les années (début et fin) de tes expériences et formations.',
    },
  });

  // Résultats chiffrés.
  checks.push({
    ok: NUMBER_RESULT_RE.test(text),
    weight: 1,
    okTip: { level: 'ok', message: 'Résultats chiffrés présents.' },
    warnTip: {
      level: 'warn',
      message: 'Peu de résultats chiffrés.',
      action: 'Ajoute des chiffres (ex. « +20 % de ventes », « 3 projets livrés »).',
    },
  });

  // Formulations creuses : on en relève jusqu'à 3.
  const found = EMPTY_WORDS.filter((w) => new RegExp(`\\b${w}`).test(normalized));
  checks.push({
    ok: found.length === 0,
    weight: 1,
    okTip: { level: 'ok', message: 'Pas de formulation creuse repérée.' },
    warnTip: {
      level: 'warn',
      message: `Formulations creuses : ${found.slice(0, 3).join(', ')}.`,
      action: 'Remplace-les par des faits concrets et des résultats.',
    },
  });

  // Mots-clés du métier visé.
  if (jobKeywords.length > 0) {
    const missing = jobKeywords.filter((k) => !normalized.includes(k));
    checks.push({
      ok: missing.length < jobKeywords.length, // au moins un mot-clé présent
      weight: 2,
      okTip: { level: 'ok', message: 'Les mots-clés de ton métier apparaissent dans le CV.' },
      warnTip: {
        level: 'warn',
        message: `Mots-clés du métier absents : ${missing.slice(0, 4).join(', ')}.`,
        action: 'Reprends les termes de ton métier visé dans ton titre et tes expériences.',
      },
    });
  }

  // Règle propre au développement / design (n'ajoute rien pour les autres métiers).
  const isTechDesign = jobKeywords.some((k) => TECH_DESIGN_HINTS.includes(k));
  if (isTechDesign) {
    const hasPortfolio = /github\.com|gitlab\.com|behance\.net|dribbble\.com|portfolio/i.test(text);
    checks.push({
      ok: hasPortfolio,
      weight: 1,
      okTip: { level: 'ok', message: 'Lien GitHub / portfolio présent.' },
      warnTip: {
        level: 'warn',
        message: 'Pas de lien GitHub ni de portfolio.',
        action: 'Ajoute un lien vers tes projets (GitHub, GitLab, portfolio).',
      },
    });
  }

  for (const c of checks) tips.push(c.ok ? c.okTip : c.warnTip);
  // Les conseils à améliorer (⚠️) d'abord.
  tips.sort((a, b) => (a.level === b.level ? 0 : a.level === 'warn' ? -1 : 1));

  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const okWeight = checks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0);
  const score = Math.round((100 * okWeight) / totalWeight);

  return { score, estimatedPages, tips };
}
