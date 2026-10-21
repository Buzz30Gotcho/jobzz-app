import {
  AUTOMATIONS,
  computeOfferScore,
  distanceKm,
  passesJuniorFilter,
  skillMatchScore,
  type AutomationCriteria,
  type NormalizedOffer,
  type OfferScore,
  type ScoringProfile,
} from '@jobzz/shared';

/**
 * Moteur d'automatisation (CLAUDE.md §4.6) : applique les **critères obligatoires de façon
 * déterministe** (le code, jamais l'IA), score les offres retenues et compte l'entonnoir.
 * Fonction pure, testée. L'ajustement IA (±15) viendra se greffer dessus en Premium.
 */
export interface AutomationFunnel {
  trouvees: number;
  apresMetierLieu: number;
  apresContratDateJunior: number;
  auDessusDuScore: number;
}

export interface AutomationMatch {
  offer: NormalizedOffer;
  score: OfferScore;
}

export interface AutomationRunResult {
  kept: AutomationMatch[];
  funnel: AutomationFunnel;
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function criteriaToScoringProfile(criteria: AutomationCriteria): ScoringProfile {
  return {
    skills: criteria.competences.map((c) => c.label),
    romeCodes: criteria.metiers.flatMap((m) => m.romeCodes),
    jobLabels: criteria.metiers.map((m) => m.label),
    locations: criteria.lieux.map((l) => ({ lat: l.lat, lng: l.lng, radiusKm: l.radiusKm })),
    availableFrom: criteria.dateDebutDu,
    experienceLevel: criteria.experienceMax ?? 'debutant',
    alternanceRythme: criteria.alternanceRythme,
    internshipDuration:
      criteria.stageDureeMin || criteria.stageDureeMax
        ? { min: criteria.stageDureeMin ?? undefined, max: criteria.stageDureeMax ?? undefined }
        : null,
  };
}

/** Lance une automatisation sur une liste d'offres : filtres obligatoires → score → entonnoir. */
export function runAutomation(offers: NormalizedOffer[], criteria: AutomationCriteria): AutomationRunResult {
  const scoring = criteriaToScoringProfile(criteria);
  const level = criteria.experienceMax ?? 'debutant';
  const freshnessMs = criteria.fraicheurJours * 24 * 60 * 60 * 1000;

  const funnel: AutomationFunnel = { trouvees: offers.length, apresMetierLieu: 0, apresContratDateJunior: 0, auDessusDuScore: 0 };

  // Étape 1 : métier + lieu.
  const step1 = offers.filter((o) => matchMetier(o, criteria) && matchLieu(o, criteria));
  funnel.apresMetierLieu = step1.length;

  // Étape 2 : contrat + fraîcheur + date + filtre junior + mots-clés indispensables/exclus + compétences indispensables.
  const step2 = step1.filter((o) => {
    if (criteria.contrats.length > 0 && o.contractType && !criteria.contrats.includes(o.contractType)) return false;
    if (o.publishedAt && Date.now() - Date.parse(o.publishedAt) > freshnessMs) return false;
    if (!passesJuniorFilter({ title: o.title, description: o.description, experienceRequired: o.experienceRequired }, level).kept)
      return false;
    if (!matchKeywords(o, criteria)) return false;
    if (!matchMandatorySkills(o, criteria)) return false;
    if (matchExcludedCompany(o, criteria)) return false;
    return true;
  });
  funnel.apresContratDateJunior = step2.length;

  // Étape 3 : score ≥ scoreMin.
  const kept: AutomationMatch[] = step2
    .map((offer) => ({ offer, score: scoreOffer(offer, scoring) }))
    .filter((m) => m.score.score >= criteria.scoreMin)
    .sort((a, b) => b.score.score - a.score.score);
  funnel.auDessusDuScore = kept.length;

  return { kept, funnel };
}

function scoreOffer(o: NormalizedOffer, scoring: ScoringProfile): OfferScore {
  return computeOfferScore(
    {
      title: o.title,
      description: o.description,
      skills: o.skills,
      romeCodes: o.romeCodes,
      contractType: o.contractType,
      remote: o.remote,
      lat: o.lat,
      lng: o.lng,
      startDate: o.startDate,
      startFlexible: o.startFlexible,
      durationMonths: o.durationMonths,
      experienceRequired: o.experienceRequired,
    },
    scoring,
  );
}

function matchMetier(o: NormalizedOffer, c: AutomationCriteria): boolean {
  const codes = c.metiers.flatMap((m) => m.romeCodes);
  if (codes.length === 0 && c.metiers.length === 0) return true; // pas de métier précisé
  const domainOk = o.romeCodes.some((code) => codes.some((p) => p.slice(0, 3) === code.slice(0, 3)));
  const haystack = normalize(`${o.title} ${o.description}`);
  const keywordOk = c.metiers.some((m) => m.label.length > 2 && haystack.includes(normalize(m.label)));
  return domainOk || keywordOk;
}

function matchLieu(o: NormalizedOffer, c: AutomationCriteria): boolean {
  if (c.teletravail === 'exige') return o.remote === 'distance';
  if (c.lieux.length === 0) return true;
  if (o.remote === 'distance' && (c.teletravail === 'accepte' || c.teletravail === 'indifferent')) return true;
  if (o.lat === null || o.lng === null) return c.teletravail !== 'exclu'; // lieu inconnu : on garde
  return c.lieux.some((l) => {
    if (l.lat === null || l.lng === null) return true;
    return distanceKm({ lat: o.lat!, lng: o.lng! }, { lat: l.lat, lng: l.lng }) <= l.radiusKm;
  });
}

function matchKeywords(o: NormalizedOffer, c: AutomationCriteria): boolean {
  const text = normalize(`${o.title} ${o.description}`);
  const { indispensables, exclure, inclure } = c.motsCles;
  if (indispensables.some((k) => !text.includes(normalize(k)))) return false;
  if (exclure.some((k) => text.includes(normalize(k)))) return false;
  if (inclure.length > 0 && !inclure.some((k) => text.includes(normalize(k)))) return false;
  return true;
}

function matchMandatorySkills(o: NormalizedOffer, c: AutomationCriteria): boolean {
  const required = c.competences.filter((s) => s.niveau === 'indispensable').map((s) => s.label);
  if (required.length === 0 || o.skills.length === 0) return true;
  return required.every((skill) => skillMatchScore(skill, o.skills) >= 0.5);
}

function matchExcludedCompany(o: NormalizedOffer, c: AutomationCriteria): boolean {
  if (!o.companyName || c.entreprise.exclureNoms.length === 0) return false;
  const name = normalize(o.companyName);
  return c.entreprise.exclureNoms.some((n) => name.includes(normalize(n)));
}

/** Prévision hebdomadaire : offres retenues sur 14 jours ÷ 2, arrondi (CLAUDE.md §4.6). */
export function previsionParSemaine(keptCount: number): number {
  return Math.round(keptCount / 2);
}

/** Nombre d'offres mises en avant comme exemples. */
export const PREVIEW_EXAMPLES = AUTOMATIONS.discoveryOffersPerMail;
