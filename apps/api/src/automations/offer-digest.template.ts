import type { MailMessage } from '../mail/mail.service';

/**
 * Mail des offres (CLAUDE.md §4.6). Un seul mail regroupe toutes les automatisations, une section
 * par automatisation. Par offre : titre, entreprise, ville, contrat, source, date + « Voir l'offre ».
 * Pas de score, pas de bouton de candidature, pas de texte préparé. HTML soigné + version texte +
 * lien de désinscription en un clic (en-tête List-Unsubscribe). Fonction pure (testée).
 */
export interface DigestOffer {
  title: string;
  companyName: string | null;
  locationLabel: string | null;
  contractType: string | null;
  source: string;
  publishedAt: string | null;
  url: string;
  isDemo: boolean;
}

export interface DigestSection {
  automationName: string;
  offers: DigestOffer[];
}

export interface DigestData {
  appName: string;
  firstName: string | null;
  sections: DigestSection[];
  manageUrl: string;
  unsubscribeUrl: string;
  /** Pour l'automatisation découverte (gratuit) : vrai total de la semaine (affiché si > envoyées). */
  weeklyTotal?: number;
  shownCount?: number;
}

const GREEN = '#15a86a';
const INK = '#0f1613';
const MUTED = '#6b756f';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function offerLine(o: DigestOffer): string {
  const meta = [o.companyName, o.locationLabel, o.contractType, `via ${o.source}`, formatDate(o.publishedAt)]
    .filter(Boolean)
    .map((x) => esc(String(x)))
    .join(' · ');
  const demo = o.isDemo ? ' <span style="color:#b45309">[Fictive]</span>' : '';
  return `
    <tr><td style="padding:12px 0;border-bottom:1px solid #e2e7e4">
      <div style="font-weight:600;color:${INK}">${esc(o.title)}${demo}</div>
      <div style="font-size:13px;color:${MUTED};margin-top:2px">${meta}</div>
      <a href="${esc(o.url)}" style="display:inline-block;margin-top:6px;color:${GREEN};font-weight:600;text-decoration:none">Voir l'offre →</a>
    </td></tr>`;
}

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString('fr-FR') : '';
}

export function buildOfferDigestEmail(data: DigestData): MailMessage & { subject: string } {
  const total = data.sections.reduce((n, s) => n + s.offers.length, 0);
  const subject = `${data.appName} · ${total} offre${total > 1 ? 's' : ''} pour toi`;

  const greeting = data.firstName ? `Salut ${esc(data.firstName)},` : 'Salut,';
  const missed =
    data.weeklyTotal && data.shownCount && data.weeklyTotal > data.shownCount
      ? `<p style="font-size:14px;color:${MUTED}">Cette semaine, <strong>${data.weeklyTotal} offres</strong> correspondaient à ta recherche. Tu en vois <strong>${data.shownCount}</strong>. Avec Premium, tu les reçois toutes, le jour même.</p>`
      : '';

  const sectionsHtml = data.sections
    .map(
      (s) => `
      <h2 style="font-size:16px;color:${INK};margin:24px 0 4px">${esc(s.automationName)}</h2>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">${s.offers.map(offerLine).join('')}</table>`,
    )
    .join('');

  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#f6f8f7;font-family:Inter,Arial,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center" style="padding:24px">
      <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#ffffff;border-radius:12px;padding:28px">
        <tr><td>
          <div style="font-family:'Space Grotesk',Arial;font-size:22px;font-weight:700;color:${INK}">Job<span style="color:${GREEN}">zz</span></div>
          <p style="font-size:15px;color:${INK}">${greeting}</p>
          <p style="font-size:14px;color:${MUTED}">Voici les offres repérées par tes automatisations.</p>
          ${missed}
          ${sectionsHtml}
          <p style="margin-top:28px;font-size:12px;color:${MUTED}">
            <a href="${esc(data.manageUrl)}" style="color:${MUTED}">Gérer mes automatisations</a> ·
            <a href="${esc(data.unsubscribeUrl)}" style="color:${MUTED}">Ne plus recevoir ce mail</a>
          </p>
        </td></tr>
      </table>
    </td></tr></table>
  </body></html>`;

  const textLines: string[] = [greeting, '', 'Offres repérées par tes automatisations :', ''];
  for (const s of data.sections) {
    textLines.push(`## ${s.automationName}`);
    for (const o of s.offers) {
      textLines.push(`- ${o.title}${o.companyName ? ` — ${o.companyName}` : ''}${o.locationLabel ? ` (${o.locationLabel})` : ''} : ${o.url}`);
    }
    textLines.push('');
  }
  textLines.push(`Gérer : ${data.manageUrl}`, `Se désinscrire : ${data.unsubscribeUrl}`);

  return {
    to: '',
    subject,
    html,
    text: textLines.join('\n'),
    headers: { 'List-Unsubscribe': `<${data.unsubscribeUrl}>` },
  };
}
