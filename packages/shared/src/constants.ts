/** Constantes partagées (valeurs énumérées communes au back et au front). */

export const PLANS = ['free', 'premium'] as const;
export type Plan = (typeof PLANS)[number];

export const ROLES = ['user', 'admin', 'support'] as const;
export type Role = (typeof ROLES)[number];

export const CONTRACT_TYPES = ['alternance', 'stage', 'cdd', 'cdi'] as const;
export type ContractType = (typeof CONTRACT_TYPES)[number];

export const EXPERIENCE_LEVELS = ['debutant', 'moins_1_an', '1_a_3_ans', 'plus_3_ans'] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const REMOTE_PREFERENCES = ['indifferent', 'accepte', 'souhaite', 'exclu'] as const;
export type RemotePreference = (typeof REMOTE_PREFERENCES)[number];

export const APPLICATION_STATUSES = ['en_attente', 'relancee', 'reponse_recue'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const RESPONSE_TYPES = ['entretien', 'refus', 'autre'] as const;
export type ResponseType = (typeof RESPONSE_TYPES)[number];

/** Origine d'une candidature : depuis une offre (« J'ai postulé ») ou un envoi libre. */
export const APPLICATION_SOURCES = ['offer', 'free_send'] as const;
export type ApplicationSource = (typeof APPLICATION_SOURCES)[number];

/** Nature d'un message envoyé (relance ou envoi libre). */
export const FOLLOWUP_KINDS = [
  'relance',
  'relance_encore',
  'spontanee',
  'remerciement',
  'linkedin',
] as const;
export type FollowUpKind = (typeof FOLLOWUP_KINDS)[number];

/** Canal par lequel l'utilisateur a envoyé (Jobzz n'envoie jamais lui-même). */
export const FOLLOWUP_CHANNELS = ['gmail', 'outlook', 'mailto', 'copy', 'linkedin'] as const;
export type FollowUpChannel = (typeof FOLLOWUP_CHANNELS)[number];

/** Types d'envoi libre (« Écrire à une entreprise »). */
export const FREE_SEND_TYPES = ['spontanee', 'remerciement'] as const;
export type FreeSendType = (typeof FREE_SEND_TYPES)[number];

export const SUBSCRIPTION_OFFERS = ['monthly', 'pass_3_months', 'launch'] as const;
export type SubscriptionOffer = (typeof SUBSCRIPTION_OFFERS)[number];

/** Fonctionnalités passant par le module `entitlements`. */
export const FEATURES = [
  'offers_viewed',
  'free_send',
  'ai_message',
  'cv_rules_analysis',
  'cv_ai_analysis',
  'cv_offer_comparison',
  'cv_offer_ai_advice',
  'active_automations',
] as const;
export type Feature = (typeof FEATURES)[number];
