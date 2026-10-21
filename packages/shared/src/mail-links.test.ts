import { describe, expect, it } from 'vitest';
import { buildMailLinks, MAIL_URL_MAX_LENGTH } from './mail-links';

describe('buildMailLinks', () => {
  const draft = { to: 'rh@exemple.fr', subject: 'Relance — Dév', body: 'Bonjour,\nMerci.' };

  it('encode correctement accents et retours à la ligne', () => {
    const links = buildMailLinks(draft);
    expect(links.gmail).toContain('to=rh%40exemple.fr');
    expect(links.mailto.startsWith('mailto:rh%40exemple.fr?')).toBe(true);
    // Le retour à la ligne est encodé (%0A), le tiret cadratin aussi.
    expect(links.gmail).toContain('%0A');
    expect(links.outlook).toContain('outlook.office.com');
  });

  it('signale les URLs trop longues (bascule « Copier »)', () => {
    const court = buildMailLinks(draft);
    expect(court.tooLong).toBe(false);

    const long = buildMailLinks({ ...draft, body: 'x'.repeat(MAIL_URL_MAX_LENGTH + 10) });
    expect(long.tooLong).toBe(true);
  });
});
