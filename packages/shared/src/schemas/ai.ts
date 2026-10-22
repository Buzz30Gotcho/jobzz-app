import { z } from 'zod';
import { FREE_SEND_TYPES } from '../constants';

/** Demande de rédaction d'un message d'envoi libre par l'IA (CLAUDE.md §4.3, §5). */
export const aiFreeMessageSchema = z.object({
  type: z.enum(FREE_SEND_TYPES),
  companyName: z.string().trim().min(1).max(160),
  position: z.string().trim().max(160).optional(),
});
export type AiFreeMessageInput = z.infer<typeof aiFreeMessageSchema>;

/** Une reformulation « avant → après » d'une phrase réelle du CV (jamais inventée). */
export const cvRewriteSchema = z.object({
  before: z.string().trim().min(1).max(400),
  after: z.string().trim().min(1).max(400),
});
export type CvRewrite = z.infer<typeof cvRewriteSchema>;

/** Sortie IA de l'analyse du CV (Premium) — CLAUDE.md §4.8. */
export const cvAiAnalysisSchema = z.object({
  overall: z.string().trim().min(1).max(800),
  strengths: z.array(z.string().trim().min(1).max(240)).min(1).max(5),
  improvements: z.array(z.string().trim().min(1).max(240)).min(1).max(5),
  rewrites: z.array(cvRewriteSchema).max(5).optional(),
});
export type CvAiAnalysis = z.infer<typeof cvAiAnalysisSchema>;

/** Sortie IA d'extraction du profil depuis le CV (CLAUDE.md §4.8). */
export const cvExtractSchema = z.object({
  jobLabel: z.string().trim().max(120).optional(),
  skills: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  city: z.string().trim().max(120).optional(),
  educationLevel: z.string().trim().max(120).optional(),
});
export type CvExtract = z.infer<typeof cvExtractSchema>;

/** Sortie IA des conseils pour adapter le CV à une offre (Premium) — CLAUDE.md §4.8. */
export const cvOfferAiAdviceSchema = z.object({
  tips: z.array(z.string().trim().min(1).max(300)).min(1).max(5),
  rewrites: z.array(cvRewriteSchema).max(3).optional(),
});
export type CvOfferAiAdvice = z.infer<typeof cvOfferAiAdviceSchema>;
