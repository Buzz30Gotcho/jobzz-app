import { z } from 'zod';

/** Tickets d'aide (CLAUDE.md §4.10). Types et statuts validés côté serveur. */
export const TICKET_TYPES = ['bug', 'question', 'idee'] as const;
export type TicketType = (typeof TICKET_TYPES)[number];

export const TICKET_STATUSES = ['ouvert', 'en_cours', 'resolu'] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  bug: 'Bug',
  question: 'Question',
  idee: 'Idée',
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  ouvert: 'Ouvert',
  en_cours: 'En cours',
  resolu: 'Résolu',
};

export const createTicketSchema = z.object({
  type: z.enum(TICKET_TYPES),
  subject: z.string().trim().min(3, 'Donne un sujet clair').max(150),
  message: z.string().trim().min(1, 'Écris ton message').max(5000),
});
export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const addTicketMessageSchema = z.object({
  body: z.string().trim().min(1, 'Écris ton message').max(5000),
});
export type AddTicketMessageInput = z.infer<typeof addTicketMessageSchema>;

export const updateTicketStatusSchema = z.object({
  status: z.enum(TICKET_STATUSES),
});
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;

export interface PublicTicketMessage {
  id: string;
  body: string;
  /** Vrai si le message vient de l'équipe (admin), faux s'il vient de l'utilisateur. */
  fromAdmin: boolean;
  hasAttachment: boolean;
  createdAt: string;
}

export interface PublicTicket {
  id: string;
  type: TicketType;
  subject: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  messages: PublicTicketMessage[];
}

export interface TicketSummary {
  id: string;
  type: TicketType;
  subject: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

/** Ligne de la liste des tickets côté admin (avec l'email de l'auteur). */
export interface AdminTicketSummary extends TicketSummary {
  userEmail: string;
}

/** Une entrée de la FAQ (`content/faq.md`), question + réponse en Markdown léger. */
export interface FaqEntry {
  question: string;
  answer: string;
}
