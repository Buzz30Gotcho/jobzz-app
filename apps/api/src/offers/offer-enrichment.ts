import type { NormalizedOffer } from '@jobzz/shared';

/**
 * Enrichissement d'une offre **par règles** (CLAUDE.md §4.4), calculé une fois et mis en cache
 * (`OfferEnrichment`). Les données structurées de la source restent prioritaires. Fonction pure.
 */
export interface OfferAttributes {
  remote: string | null; // sur_site / hybride / distance
  rhythm: string | null; // ex. « 3 semaines / 1 semaine »
  esn: boolean; // indices d'ESN / société de conseil
}

export interface EnrichmentResult {
  attributes: OfferAttributes;
  confidence: Record<keyof OfferAttributes, number>;
}

const ESN_HINTS = ['esn', 'ssii', 'client final', 'régie', 'regie', 'intercontrat', 'infogérance', 'infogerance'];

export function enrichOfferRules(offer: NormalizedOffer): EnrichmentResult {
  const text = `${offer.title} ${offer.description}`.toLowerCase();

  // Télétravail : champ structuré prioritaire, sinon mots-clés du texte.
  let remote = offer.remote;
  let remoteConfidence = offer.remote ? 1 : 0;
  if (!remote) {
    if (/t[ée]l[ée]travail|remote|100\s*%\s*distanciel|full remote/.test(text)) {
      remote = 'distance';
      remoteConfidence = 0.6;
    } else if (/hybride|partiel/.test(text)) {
      remote = 'hybride';
      remoteConfidence = 0.5;
    }
  }

  // Rythme d'alternance (motifs « 3 semaines / 1 semaine », « 2 jours / 3 jours »).
  const rhythmMatch = text.match(/(\d+)\s*(semaines?|jours?)\s*\/\s*(\d+)\s*(semaines?|jours?)/);
  const rhythm = rhythmMatch ? rhythmMatch[0] : null;

  const esn = ESN_HINTS.some((h) => text.includes(h));

  return {
    attributes: { remote, rhythm, esn },
    confidence: {
      remote: remoteConfidence,
      rhythm: rhythm ? 0.6 : 0,
      esn: esn ? 0.5 : 0,
    },
  };
}
