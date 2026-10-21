import { describe, expect, it } from 'vitest';
import { buildOfferDigestEmail } from './offer-digest.template';

const base = {
  appName: 'Jobzz',
  firstName: 'Fred',
  manageUrl: 'https://app.test/app/offres/automatisations',
  unsubscribeUrl: 'https://app.test/desinscription?token=abc',
  sections: [
    {
      automationName: 'Alternance dev',
      offers: [
        { title: 'Développeur web', companyName: 'Acme', locationLabel: 'Montpellier', contractType: 'alternance', source: 'demo', publishedAt: '2026-10-18', url: 'https://offre.test/1', isDemo: true },
      ],
    },
  ],
};

describe('buildOfferDigestEmail', () => {
  it('construit sujet, HTML et texte avec le lien vers l\'offre', () => {
    const m = buildOfferDigestEmail(base);
    expect(m.subject).toContain('1 offre');
    expect(m.html).toContain('Développeur web');
    expect(m.html).toContain('https://offre.test/1');
    expect(m.text).toContain('Développeur web');
    expect(m.headers?.['List-Unsubscribe']).toContain('desinscription');
  });

  it('n\'affiche la ligne « ce que tu rates » que si le total dépasse les offres envoyées', () => {
    const withMissed = buildOfferDigestEmail({ ...base, weeklyTotal: 14, shownCount: 5 });
    expect(withMissed.html).toContain('14 offres');
    const without = buildOfferDigestEmail({ ...base, weeklyTotal: 1, shownCount: 1 });
    expect(without.html).not.toContain('correspondaient à ta recherche');
  });

  it('échappe le HTML des données non fiables', () => {
    const m = buildOfferDigestEmail({
      ...base,
      sections: [{ automationName: 'x', offers: [{ ...base.sections[0].offers[0], title: '<script>alert(1)</script>' }] }],
    });
    expect(m.html).not.toContain('<script>alert(1)</script>');
    expect(m.html).toContain('&lt;script&gt;');
  });
});
