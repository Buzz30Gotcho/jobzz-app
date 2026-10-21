import { z } from 'zod';
import type { ContractType } from '../constants';

/**
 * Offre normalisée (CLAUDE.md §4.4, §6) : format unique produit par chaque connecteur `JobSource`.
 */
export interface NormalizedOffer {
  source: string;
  externalId: string;
  url: string;
  title: string;
  companyName: string | null;
  siret: string | null;
  locationLabel: string | null;
  communeCode: string | null;
  lat: number | null;
  lng: number | null;
  contractType: ContractType | null;
  /** apprentissage / professionnalisation (alternance). */
  contractNature: string | null;
  /** sur_site / hybride / distance. */
  remote: string | null;
  startDate: string | null; // ISO date
  startFlexible: boolean | null;
  durationMonths: number | null;
  experienceRequired: string | null;
  salaryText: string | null;
  skills: string[];
  romeCodes: string[];
  description: string;
  publishedAt: string | null; // ISO
  sourceUpdatedAt: string | null; // ISO
  isDemo: boolean;
}

/** Offre renvoyée au front (avec score et explication). */
export interface PublicOffer {
  id: string;
  source: string;
  url: string;
  title: string;
  companyName: string | null;
  locationLabel: string | null;
  distanceKm: number | null;
  contractType: ContractType | null;
  remote: string | null;
  startDate: string | null;
  durationMonths: number | null;
  salaryText: string | null;
  skills: string[];
  description: string;
  publishedAt: string | null;
  isDemo: boolean;
  score: number;
  scoreLabel: string;
  explanation: string;
  /** Floutée (gratuit au-delà de la limite du jour) : seuls rang et score sont lisibles. */
  locked: boolean;
}

/** Résultat d'une recherche manuelle. */
export interface SearchResult {
  offers: PublicOffer[];
  total: number;
  /** Limite du jour (gratuit) : nombre vu / limite, et nombre d'offres encore pertinentes. */
  viewed: number;
  dailyLimit: number | null;
  remainingMatches: number;
  /** Message honnête si une source est en panne. */
  notice: string | null;
}

export const searchOffersSchema = z.object({
  motsCles: z.string().trim().max(160).optional(),
  commune: z.string().trim().max(10).optional(),
  distance: z.coerce.number().int().min(0).max(200).optional(),
  contractType: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => (Array.isArray(v) ? v : v ? [v] : undefined)),
  page: z.coerce.number().int().min(1).default(1),
});
export type SearchOffersInput = z.infer<typeof searchOffersSchema>;
