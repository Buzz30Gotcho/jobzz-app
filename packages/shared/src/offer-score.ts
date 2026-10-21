import { SCORING } from './config';
import type { ContractType, ExperienceLevel } from './constants';
import { distanceKm } from './geo-distance';
import { skillMatchScore } from './data/skill-families';

/**
 * Score de compatibilité déterministe (CLAUDE.md §4.7). Fonction pure, testée, poids dans la config.
 * `score = 100 × Σ(poids × sous-score) / Σ(poids applicables)`, borné 0–100 ; puis libellé et
 * explication générés par le code (jamais inventés par l'IA).
 */
export interface ScoringProfile {
  skills: string[];
  romeCodes: string[];
  jobLabels: string[];
  locations: { lat: number | null; lng: number | null; radiusKm: number }[];
  availableFrom: string | null; // YYYY-MM-DD
  experienceLevel: ExperienceLevel | null;
  alternanceRythme?: string | null;
  internshipDuration?: { min?: number; max?: number } | null;
}

export interface ScorableOffer {
  title: string;
  description: string;
  skills: string[];
  romeCodes: string[];
  contractType: ContractType | null;
  remote: string | null;
  lat: number | null;
  lng: number | null;
  startDate: string | null;
  startFlexible: boolean | null;
  durationMonths: number | null;
  experienceRequired: string | null;
}

export interface OfferScore {
  score: number;
  label: string;
  explanation: string;
  matched: string[];
  missing: string[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function scoreLabel(score: number): string {
  if (score >= SCORING.labels.excellent) return 'Excellent match';
  if (score >= SCORING.labels.good) return 'Bon match';
  if (score >= SCORING.labels.explore) return 'À explorer';
  return '';
}

export function computeOfferScore(offer: ScorableOffer, profile: ScoringProfile): OfferScore {
  const parts: { weight: number; sub: number }[] = [];
  const matched: string[] = [];
  const missing: string[] = [];

  // --- Compétences (50) ---
  if (offer.skills.length === 0) {
    parts.push({ weight: SCORING.weights.skills, sub: 0.6 });
  } else {
    let sum = 0;
    for (const skill of offer.skills) {
      const s = skillMatchScore(skill, profile.skills);
      sum += s;
      if (s >= 0.5) matched.push(skill);
      else if (s === 0) missing.push(skill);
    }
    parts.push({ weight: SCORING.weights.skills, sub: Math.min(1, sum / offer.skills.length) });
  }

  // --- Métier (20) ---
  parts.push({ weight: SCORING.weights.job, sub: jobSubScore(offer, profile) });

  // --- Lieu (10) ---
  const loc = locationSubScore(offer, profile);
  if (loc !== null) parts.push({ weight: SCORING.weights.location, sub: loc });

  // --- Date de début (10) ---
  const start = startSubScore(offer, profile);
  if (start !== null) parts.push({ weight: SCORING.weights.startDate, sub: start });

  // --- Rythme / durée / expérience (10) ---
  const rde = rhythmSubScore(offer, profile);
  if (rde !== null) parts.push({ weight: SCORING.weights.rhythmDurationExperience, sub: rde });

  const totalWeight = parts.reduce((acc, p) => acc + p.weight, 0);
  const weighted = parts.reduce((acc, p) => acc + p.weight * p.sub, 0);
  const score = totalWeight === 0 ? 0 : Math.round((100 * weighted) / totalWeight);
  const bounded = Math.max(0, Math.min(100, score));

  return {
    score: bounded,
    label: scoreLabel(bounded),
    explanation: buildExplanation(offer, matched, missing),
    matched,
    missing,
  };
}

function jobSubScore(offer: ScorableOffer, profile: ScoringProfile): number {
  const offerCodes = offer.romeCodes.map((c) => c.toUpperCase());
  const profileCodes = profile.romeCodes.map((c) => c.toUpperCase());
  if (offerCodes.some((c) => profileCodes.includes(c))) return 1;
  if (offerCodes.some((c) => profileCodes.some((p) => p.slice(0, 3) === c.slice(0, 3)))) return 0.6;
  const haystack = `${offer.title} ${offer.description}`.toLowerCase();
  if (profile.jobLabels.some((l) => l.length > 2 && haystack.includes(l.toLowerCase()))) return 0.4;
  return 0;
}

function locationSubScore(offer: ScorableOffer, profile: ScoringProfile): number | null {
  if (offer.remote === 'distance') return 1;
  if (offer.lat === null || offer.lng === null) return null;
  const geoLocations = profile.locations.filter((l) => l.lat !== null && l.lng !== null);
  if (geoLocations.length === 0) return null;

  let best = 0;
  for (const l of geoLocations) {
    const d = distanceKm({ lat: offer.lat, lng: offer.lng }, { lat: l.lat!, lng: l.lng! });
    const r = Math.max(1, l.radiusKm);
    let sub: number;
    if (d <= r / 2) sub = 1;
    else if (d <= r) sub = 1 - 0.5 * ((d - r / 2) / (r / 2));
    else sub = 0.5;
    best = Math.max(best, sub);
  }
  return best;
}

function startSubScore(offer: ScorableOffer, profile: ScoringProfile): number | null {
  if (!profile.availableFrom) return null;
  if (offer.startFlexible) return 0.9;
  if (!offer.startDate) return 0.7;
  const diffDays = Math.abs(
    (Date.parse(`${offer.startDate.slice(0, 10)}T00:00:00Z`) -
      Date.parse(`${profile.availableFrom}T00:00:00Z`)) /
      DAY_MS,
  );
  if (diffDays <= 15) return 1;
  if (diffDays <= 90) return 0.7;
  return 0.4;
}

function rhythmSubScore(offer: ScorableOffer, profile: ScoringProfile): number | null {
  if (!offer.contractType) return null;
  if (offer.contractType === 'alternance') {
    if (!profile.alternanceRythme) return 0.8;
    // Comparaison grossière des chiffres du rythme (ex. « 3/1 »).
    const offerDigits = (offer.description.match(/\d+/g) ?? []).join('');
    const profDigits = (profile.alternanceRythme.match(/\d+/g) ?? []).join('');
    if (profDigits && offerDigits.includes(profDigits)) return 1;
    return 0.5;
  }
  if (offer.contractType === 'stage') {
    const range = profile.internshipDuration;
    if (!range || offer.durationMonths === null) return 0.8;
    const okMin = range.min === undefined || offer.durationMonths >= range.min;
    const okMax = range.max === undefined || offer.durationMonths <= range.max;
    return okMin && okMax ? 1 : 0.4;
  }
  // CDD / CDI
  const exp = (offer.experienceRequired ?? '').toLowerCase();
  if (!exp || exp.includes('débutant') || exp.includes('debutant')) return 1;
  if (/[01]\s*an/.test(exp)) return 0.7;
  return 0.7;
}

function buildExplanation(offer: ScorableOffer, matched: string[], missing: string[]): string {
  const parts: string[] = [];
  if (offer.skills.length === 0) {
    parts.push('compétences non précisées');
  } else if (matched.length > 0) {
    parts.push(`tu as ${matched.slice(0, 3).join(', ')}`);
  }
  if (missing.length > 0) {
    parts.push(`il te manque ${missing.slice(0, 2).join(', ')}`);
  }
  return parts.join(' · ');
}
