import type { FollowUpKind } from '../constants';

/**
 * Modèles de messages (CLAUDE.md §4.3). Courts, polis, professionnels, adaptés à tous les
 * métiers. Fichier de données **facile à modifier**. Les variables sont entre accolades :
 * {entreprise}, {poste}, {date_candidature}, {prenom}, {signature}.
 *
 * Jobzz ne rédige jamais de lettre de motivation ni de candidature à une offre : ces modèles
 * servent uniquement aux relances et aux envois libres (spontanée, remerciement).
 */

export interface MessageTemplate {
  subject: string;
  body: string;
}

export type TemplateVars = {
  entreprise?: string;
  poste?: string;
  date_candidature?: string;
  prenom?: string;
  signature?: string;
};

export const MESSAGE_TEMPLATES: Record<FollowUpKind, MessageTemplate> = {
  relance: {
    subject: 'Relance — candidature {poste}',
    body: `Bonjour,

Je me permets de revenir vers vous au sujet de ma candidature au poste de {poste}, envoyée le {date_candidature}.

Je reste très motivé(e) par cette opportunité au sein de {entreprise} et je serais ravi(e) d'échanger avec vous.

Je vous remercie par avance pour votre retour.

{signature}`,
  },
  relance_encore: {
    subject: 'Relance — {poste}',
    body: `Bonjour,

Je me permets de vous relancer une dernière fois concernant ma candidature au poste de {poste} chez {entreprise}.

Restant à votre disposition, je vous remercie pour votre attention.

{signature}`,
  },
  spontanee: {
    subject: 'Candidature spontanée — {poste}',
    body: `Bonjour,

Je me permets de vous adresser ma candidature spontanée pour un poste de {poste} au sein de {entreprise}.

Convaincu(e) que mon profil pourrait vous intéresser, je serais ravi(e) de vous présenter ma motivation plus en détail.

Je vous remercie pour votre attention.

{signature}`,
  },
  remerciement: {
    subject: 'Merci pour notre échange',
    body: `Bonjour,

Je tenais à vous remercier pour le temps que vous m'avez accordé lors de notre échange au sujet du poste de {poste}.

Cette rencontre a renforcé mon intérêt pour {entreprise}, et je reste à votre disposition pour toute information complémentaire.

{signature}`,
  },
  linkedin: {
    // Message court (< 300 caractères) pour LinkedIn, quand il n'y a pas d'email (CLAUDE.md §4.3).
    subject: '',
    body: `Bonjour, j'ai postulé au poste de {poste} chez {entreprise} et je me permets de vous contacter pour vous faire part de ma motivation. Seriez-vous ouvert(e) à un court échange ? Merci beaucoup. {prenom}`,
  },
};

/** Remplace les variables {xxx} par leur valeur (vide si absente). Fonction pure. */
export function renderTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = (vars as Record<string, string | undefined>)[key];
    return value ?? '';
  });
}

/** Rend un modèle complet (sujet + corps), en nettoyant les lignes vides en trop. */
export function renderMessage(kind: FollowUpKind, vars: TemplateVars): MessageTemplate {
  const template = MESSAGE_TEMPLATES[kind];
  return {
    subject: renderTemplate(template.subject, vars).trim(),
    body: renderTemplate(template.body, vars).replace(/\n{3,}/g, '\n\n').trim(),
  };
}
