import { describe, expect, it } from 'vitest';
import { computeProfileCompletion } from './profile-completion';

const empty = {
  jobTargets: [],
  contractTypes: [],
  locations: [],
  availableFrom: null,
  skills: [],
  sectors: [],
  linkedinUrl: null,
  remotePreference: null,
};

describe('computeProfileCompletion', () => {
  it('profil vide → 0 %', () => {
    const { percent, items } = computeProfileCompletion(empty);
    expect(percent).toBe(0);
    expect(items.every((i) => !i.done)).toBe(true);
  });

  it('profil complet (avec CV) → 100 %', () => {
    const { percent } = computeProfileCompletion({
      jobTargets: [{ label: 'Développeur web', romeCodes: ['M1805'] }],
      contractTypes: ['alternance'],
      locations: [{ communeCode: '34172', label: 'Montpellier', lat: 43.6, lng: 3.87, radiusKm: 30 }],
      availableFrom: '2027-01-01',
      skills: ['TypeScript'],
      sectors: ['Numérique'],
      linkedinUrl: 'https://linkedin.com/in/moi',
      remotePreference: 'accepte',
      hasCv: true,
    });
    expect(percent).toBe(100);
  });

  it('les obligatoires seuls (sans CV ni options) donnent une complétude partielle', () => {
    const { percent, items } = computeProfileCompletion({
      ...empty,
      jobTargets: [{ label: 'Vendeur', romeCodes: [] }],
      contractTypes: ['cdi'],
      locations: [{ label: 'Lyon', communeCode: null, lat: null, lng: null, radiusKm: 30 }],
      availableFrom: '2027-02-01',
    });
    // 4 pastilles faites sur 9.
    expect(items.filter((i) => i.done).length).toBe(4);
    expect(percent).toBe(Math.round((4 / 9) * 100));
  });

  it('la pastille CV reflète hasCv', () => {
    const withCv = computeProfileCompletion({ ...empty, hasCv: true });
    expect(withCv.items.find((i) => i.key === 'cv')?.done).toBe(true);
  });
});
