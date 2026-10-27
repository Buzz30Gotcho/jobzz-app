import type { MailMessage } from './mail.service';

/**
 * Gabarits de mail de l'authentification. HTML simple et sobre + version texte.
 * Les gabarits riches (MJML) des offres arrivent à l'étape 6.
 */
const BRAND = '#3BE38B';
const BG = '#0B0D0C';
const TEXT = '#F2F5F3';

function layout(appName: string, title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="fr">
<body style="margin:0;background:${BG};color:${TEXT};font-family:Inter,Arial,sans-serif;padding:32px">
  <div style="max-width:520px;margin:0 auto;background:#141816;border:1px solid #2A302C;border-radius:12px;padding:32px">
    <div style="font-size:24px;font-weight:700;margin-bottom:24px">Job<span style="color:${BRAND}">zz</span></div>
    <h1 style="font-size:20px;margin:0 0 16px">${title}</h1>
    ${bodyHtml}
    <p style="color:#6B756F;font-size:12px;margin-top:32px">${appName} — trouve les offres qui te correspondent, et relance au bon moment.</p>
  </div>
</body>
</html>`;
}

function button(url: string, label: string): string {
  return `<a href="${url}" style="display:inline-block;background:${BRAND};color:${BG};text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px">${label}</a>`;
}

export function verifyEmailMail(appName: string, to: string, url: string): MailMessage {
  return {
    to,
    subject: `${appName} — confirme ton adresse email`,
    html: layout(
      appName,
      'Confirme ton adresse email',
      `<p>Bienvenue sur ${appName} ! Confirme ton adresse pour recevoir le mail des offres.</p>
       <p style="margin:24px 0">${button(url, 'Confirmer mon email')}</p>
       <p style="color:#A3ADA7;font-size:13px">Ce lien est valable 48 heures. Si tu n'es pas à l'origine de cette inscription, ignore ce message.</p>`,
    ),
    text: `Bienvenue sur ${appName} !\n\nConfirme ton adresse email : ${url}\n\nCe lien est valable 48 heures.`,
  };
}

export function resetPasswordMail(appName: string, to: string, url: string): MailMessage {
  return {
    to,
    subject: `${appName} — réinitialise ton mot de passe`,
    html: layout(
      appName,
      'Réinitialise ton mot de passe',
      `<p>Tu as demandé à réinitialiser ton mot de passe.</p>
       <p style="margin:24px 0">${button(url, 'Choisir un nouveau mot de passe')}</p>
       <p style="color:#A3ADA7;font-size:13px">Ce lien est valable 1 heure. Si tu n'es pas à l'origine de cette demande, ignore ce message : ton mot de passe reste inchangé.</p>`,
    ),
    text: `Réinitialise ton mot de passe : ${url}\n\nCe lien est valable 1 heure.`,
  };
}

/** Échec de paiement d'un abonnement : on invite à mettre à jour la carte via le portail Stripe. */
export function paymentFailedMail(appName: string, to: string, portalUrl: string): MailMessage {
  return {
    to,
    subject: `${appName} — problème avec ton paiement`,
    html: layout(
      appName,
      'Ton paiement n’a pas abouti',
      `<p>Le paiement de ton abonnement Premium a échoué. Pas d'inquiétude : nous réessaierons
        automatiquement dans les prochains jours.</p>
       <p>Pour éviter toute coupure, tu peux mettre à jour ta carte dès maintenant :</p>
       <p style="margin:24px 0">${button(portalUrl, 'Gérer mon abonnement')}</p>
       <p style="color:#A3ADA7;font-size:13px">Tes données et ton accès restent intacts pendant les nouvelles tentatives.</p>`,
    ),
    text: `Le paiement de ton abonnement Premium a échoué. Nous réessaierons automatiquement.\n\nMets à jour ta carte : ${portalUrl}`,
  };
}

/** Alerte à l'admin quand un utilisateur ouvre un ticket (CLAUDE.md §4.10). */
export function ticketCreatedAdminMail(
  appName: string,
  adminEmail: string,
  ticketType: string,
  subject: string,
  ticketUrl: string,
): MailMessage {
  return {
    to: adminEmail,
    subject: `${appName} — nouveau ticket (${ticketType}) : ${subject}`,
    html: layout(
      appName,
      'Nouveau ticket',
      `<p>Un utilisateur vient d'ouvrir un ticket <strong>${ticketType}</strong>.</p>
       <p style="color:#A3ADA7">Sujet : ${subject}</p>
       <p style="margin:24px 0">${button(ticketUrl, 'Ouvrir le ticket')}</p>`,
    ),
    text: `Nouveau ticket (${ticketType}) : ${subject}\n\nOuvrir : ${ticketUrl}`,
  };
}

/** Notification à l'utilisateur quand l'équipe répond à son ticket (CLAUDE.md §4.10). */
export function ticketRepliedUserMail(
  appName: string,
  to: string,
  subject: string,
  ticketUrl: string,
): MailMessage {
  return {
    to,
    subject: `${appName} — réponse à ta demande : ${subject}`,
    html: layout(
      appName,
      'Tu as une réponse',
      `<p>L'équipe ${appName} a répondu à ta demande « ${subject} ».</p>
       <p style="margin:24px 0">${button(ticketUrl, 'Voir la réponse')}</p>`,
    ),
    text: `L'équipe ${appName} a répondu à ta demande « ${subject} ».\n\nVoir : ${ticketUrl}`,
  };
}

/** Confirmation de suppression définitive du compte et des données (CLAUDE.md §4.12). */
export function accountDeletedMail(appName: string, to: string): MailMessage {
  return {
    to,
    subject: `${appName} — ton compte a été supprimé`,
    html: layout(
      appName,
      'Ton compte a bien été supprimé',
      `<p>Ton compte ${appName} et toutes tes données ont été supprimés définitivement, comme demandé.</p>
       <p style="color:#A3ADA7;font-size:13px">Il n'y a rien d'autre à faire. Si tu changes d'avis un jour,
        tu pourras recréer un compte quand tu veux. Bonne continuation dans ta recherche !</p>`,
    ),
    text: `Ton compte ${appName} et toutes tes données ont été supprimés définitivement.\n\nBonne continuation dans ta recherche !`,
  };
}

/** Préavis avant la fin d'un Pass 3 mois (sans renouvellement automatique). */
export function passEndingMail(
  appName: string,
  to: string,
  endsAt: Date,
  pricingUrl: string,
): MailMessage {
  const date = endsAt.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris',
  });
  return {
    to,
    subject: `${appName} — ton Pass Premium se termine bientôt`,
    html: layout(
      appName,
      'Ton Pass 3 mois se termine bientôt',
      `<p>Ton Pass Premium prend fin le <strong>${date}</strong>. Il ne se renouvelle pas
        automatiquement.</p>
       <p>Si ta recherche continue, tu peux reprendre un Premium quand tu veux :</p>
       <p style="margin:24px 0">${button(pricingUrl, 'Voir les offres')}</p>
       <p style="color:#A3ADA7;font-size:13px">Tes données restent intactes : repasser en gratuit ne supprime rien.</p>`,
    ),
    text: `Ton Pass Premium se termine le ${date} (sans renouvellement automatique).\n\nReprendre un Premium : ${pricingUrl}`,
  };
}
