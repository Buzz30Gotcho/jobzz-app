import { z } from 'zod';
import { FREE_SEND_TYPES } from '../constants';

/** Demande de rédaction d'un message d'envoi libre par l'IA (CLAUDE.md §4.3, §5). */
export const aiFreeMessageSchema = z.object({
  type: z.enum(FREE_SEND_TYPES),
  companyName: z.string().trim().min(1).max(160),
  position: z.string().trim().max(160).optional(),
});
export type AiFreeMessageInput = z.infer<typeof aiFreeMessageSchema>;
