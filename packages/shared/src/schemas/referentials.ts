import { z } from 'zod';

/**
 * Référentiels (CLAUDE.md §4.2) :
 * - communes via geo.api.gouv.fr (gratuit, sans clé) → code INSEE, département, coordonnées ;
 * - métiers via le référentiel ROME (API France Travail) ; sinon saisie libre.
 * Les codes ROME ne sont jamais inventés : ils viennent uniquement du référentiel.
 */

/** Une commune résolue (ce que renvoie l'autocomplétion des villes). */
export interface Commune {
  /** Code INSEE. */
  code: string;
  label: string;
  postalCode: string | null;
  departement: string | null;
  lat: number | null;
  lng: number | null;
}

/** Un métier du référentiel ROME. */
export interface RomeJob {
  code: string;
  label: string;
}

/** Requête d'autocomplétion : au moins 2 caractères. */
export const referentialQuerySchema = z.object({
  q: z.string().trim().min(2, 'Au moins 2 caractères').max(120),
});
export type ReferentialQuery = z.infer<typeof referentialQuerySchema>;
