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
