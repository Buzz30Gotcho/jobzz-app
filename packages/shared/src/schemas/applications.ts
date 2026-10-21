import { z } from 'zod';
import { FOLLOWUP_CHANNELS, FOLLOWUP_KINDS, FREE_SEND_TYPES, RESPONSE_TYPES } from '../constants';

/**
 * Schémas des candidatures et relances (CLAUDE.md §4.3). Une candidature n'est créée que de
 * 2 façons : « J'ai postulé » sur une offre, ou « Écrire à une entreprise » (envoi libre).
 */

const company = z.string().trim().min(1, "Nom de l'entreprise requis").max(160);
const position = z.string().trim().min(1, 'Intitulé du poste requis').max(160);
const email = z.string().trim().email('Email invalide').max(254);
const dateOnly = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format AAAA-MM-JJ')
  .optional();

/** « J'ai postulé » sur une offre de la recherche. */
export const createFromOfferSchema = z.object({
  companyName: company,
  position,
  contactEmail: email.optional(),
  offerId: z.string().trim().max(100).optional(),
  offerUrl: z.string().trim().url().max(1000).optional(),
  appliedAt: dateOnly,
});
export type CreateFromOfferInput = z.infer<typeof createFromOfferSchema>;

/** « Écrire à une entreprise » : candidature spontanée ou remerciement après entretien. */
export const freeSendSchema = z.object({
  type: z.enum(FREE_SEND_TYPES),
  companyName: company,
  contactEmail: email,
  position: position.optional(),
  /** Pour un remerciement rattaché à une candidature existante. */
  applicationId: z.string().uuid().optional(),
  subject: z.string().trim().max(200).default(''),
  body: z.string().trim().min(1, 'Message requis').max(5000),
  channel: z.enum(FOLLOWUP_CHANNELS).default('copy'),
});
export type FreeSendInput = z.infer<typeof freeSendSchema>;

/** Enregistre une relance effectuée (l'utilisateur a envoyé via sa messagerie). */
export const recordFollowUpSchema = z.object({
  kind: z.enum(FOLLOWUP_KINDS),
  channel: z.enum(FOLLOWUP_CHANNELS),
  subject: z.string().trim().max(200).optional(),
  body: z.string().trim().min(1).max(5000),
  aiGenerated: z.boolean().default(false),
});
export type RecordFollowUpInput = z.infer<typeof recordFollowUpSchema>;

/** « L'entreprise a répondu » : entretien / refus / autre. */
export const respondSchema = z.object({
  responseType: z.enum(RESPONSE_TYPES),
});
export type RespondInput = z.infer<typeof respondSchema>;

/** Filtre de la liste « Mes candidatures ». */
export const APPLICATION_FILTERS = ['toutes', 'en_attente', 'relancee', 'reponse_recue', 'archivees'] as const;
export type ApplicationFilter = (typeof APPLICATION_FILTERS)[number];

export const listApplicationsSchema = z.object({
  filter: z.enum(APPLICATION_FILTERS).default('toutes'),
  search: z.string().trim().max(160).optional(),
});
export type ListApplicationsInput = z.infer<typeof listApplicationsSchema>;
