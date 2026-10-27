import { z } from 'zod';
import { PLANS } from '../constants';

/** Actions admin sur un utilisateur (CLAUDE.md §4.11), validées côté serveur. */
export const adminSetPlanSchema = z.object({
  plan: z.enum(PLANS),
});
export type AdminSetPlanInput = z.infer<typeof adminSetPlanSchema>;

export const adminDisableUserSchema = z.object({
  disabled: z.boolean(),
});
export type AdminDisableUserInput = z.infer<typeof adminDisableUserSchema>;
