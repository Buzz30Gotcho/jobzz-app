import { z } from 'zod';
import { CONTRACT_TYPES } from '../constants';

/** « J'ai trouvé ! » (CLAUDE.md §4.9) : ce que l'utilisateur a décroché + ressenti. */
export const HELPFULNESS_VALUES = ['beaucoup', 'un_peu', 'pas_vraiment'] as const;
export type Helpfulness = (typeof HELPFULNESS_VALUES)[number];

export const createJobOutcomeSchema = z.object({
  contractType: z.enum(CONTRACT_TYPES),
  companyName: z.string().trim().max(150).optional(),
  helpfulness: z.enum(HELPFULNESS_VALUES).optional(),
  comment: z.string().trim().max(2000).optional(),
});
export type CreateJobOutcomeInput = z.infer<typeof createJobOutcomeSchema>;

export interface PublicJobOutcome {
  id: string;
  contractType: string;
  companyName: string | null;
  helpfulness: Helpfulness | null;
  foundAt: string;
  cancelledAt: string | null;
}
