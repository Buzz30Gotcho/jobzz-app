import type { ContractType, NormalizedOffer } from '@jobzz/shared';

/** Requête adressée à une source d'offres (paramètres normalisés, indépendants de chaque API). */
export interface SourceQuery {
  romeCodes?: string[];
  motsCles?: string;
  communeCode?: string;
  lat?: number;
  lng?: number;
  distanceKm?: number;
  contractTypes?: ContractType[];
  /** Offres publiées depuis N jours. */
  publishedSinceDays?: number;
}

export interface SourceResult {
  offers: NormalizedOffer[];
  /** Message d'erreur si la source a échoué (exécution partielle, jamais d'offres inventées). */
  error?: string;
}

/**
 * Interface commune à tous les connecteurs (CLAUDE.md §4.4). Chaque source normalise vers
 * `NormalizedOffer`. Jamais de scraping : sources officielles uniquement.
 */
export interface JobSource {
  readonly name: string;
  isEnabled(): boolean;
  search(query: SourceQuery): Promise<SourceResult>;
}
