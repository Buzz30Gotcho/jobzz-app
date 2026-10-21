/**
 * Construction des liens d'envoi (CLAUDE.md §4.3). Jobzz n'envoie **aucun** mail depuis le
 * serveur : il ouvre la messagerie de l'utilisateur avec le message pré-rempli. Fonctions pures.
 */

export interface MailDraft {
  to: string;
  subject: string;
  body: string;
}

export interface MailLinks {
  gmail: string;
  outlook: string;
  mailto: string;
  /** Vrai si l'URL dépasse la limite : il faut alors copier le message et le coller à la main. */
  tooLong: boolean;
}

/** Au-delà de cette longueur d'URL, on bascule sur « Copier » (CLAUDE.md §4.3). */
export const MAIL_URL_MAX_LENGTH = 1800;

export function buildMailLinks(draft: MailDraft): MailLinks {
  const to = encodeURIComponent(draft.to);
  const subject = encodeURIComponent(draft.subject);
  const body = encodeURIComponent(draft.body);

  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;
  const outlook = `https://outlook.office.com/mail/deeplink/compose?to=${to}&subject=${subject}&body=${body}`;
  const mailto = `mailto:${to}?subject=${subject}&body=${body}`;

  const tooLong = Math.max(gmail.length, outlook.length, mailto.length) > MAIL_URL_MAX_LENGTH;
  return { gmail, outlook, mailto, tooLong };
}
