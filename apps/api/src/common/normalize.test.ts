import { describe, expect, it } from 'vitest';
import { normalizeKey } from './normalize';

describe('normalizeKey', () => {
  it('met en minuscules et enlève les accents', () => {
    expect(normalizeKey('Développeur Réseau')).toBe('developpeur reseau');
  });

  it('enlève la ponctuation', () => {
    expect(normalizeKey('Data-Analyst (junior)')).toBe('data analyst junior');
  });

  it('enlève les formes juridiques', () => {
    expect(normalizeKey('Acme SAS')).toBe('acme');
    expect(normalizeKey('Studio Pixel SARL')).toBe('studio pixel');
  });

  it('considère deux variantes de la même entreprise comme identiques', () => {
    expect(normalizeKey('Côté Soleil, SASU')).toBe(normalizeKey('Cote Soleil'));
  });

  it('réduit les espaces multiples', () => {
    expect(normalizeKey('  Big   Corp  ')).toBe('big corp');
  });
});
