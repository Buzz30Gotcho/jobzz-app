import { describe, expect, it } from 'vitest';
import { profileUpdateSchema } from './profile';

describe('profileUpdateSchema', () => {
  it('applique les valeurs par défaut sur un corps vide', () => {
    const parsed = profileUpdateSchema.parse({});
    expect(parsed.jobTargets).toEqual([]);
    expect(parsed.skills).toEqual([]);
    expect(parsed.firstName).toBeNull();
    expect(parsed.availableFrom).toBeNull();
  });

  it('transforme les chaînes vides en null', () => {
    const parsed = profileUpdateSchema.parse({ firstName: '   ', phone: '' });
    expect(parsed.firstName).toBeNull();
    expect(parsed.phone).toBeNull();
  });

  it('refuse un code ROME inventé', () => {
    const r = profileUpdateSchema.safeParse({ jobTargets: [{ label: 'Dev', romeCodes: ['banane'] }] });
    expect(r.success).toBe(false);
  });

  it('accepte un code ROME valide', () => {
    const r = profileUpdateSchema.safeParse({ jobTargets: [{ label: 'Dev', romeCodes: ['M1805'] }] });
    expect(r.success).toBe(true);
  });

  it('refuse une date de début mal formée', () => {
    expect(profileUpdateSchema.safeParse({ availableFrom: '01/2027' }).success).toBe(false);
    expect(profileUpdateSchema.safeParse({ availableFrom: '2027-01-15' }).success).toBe(true);
  });

  it('refuse un lien LinkedIn sans http', () => {
    expect(profileUpdateSchema.safeParse({ linkedinUrl: 'linkedin.com/in/moi' }).success).toBe(false);
    expect(profileUpdateSchema.safeParse({ linkedinUrl: 'https://linkedin.com/in/moi' }).success).toBe(true);
  });

  it('donne un rayon par défaut de 30 km à une localisation', () => {
    const parsed = profileUpdateSchema.parse({ locations: [{ label: 'Lille' }] });
    expect(parsed.locations[0].radiusKm).toBe(30);
    expect(parsed.locations[0].communeCode).toBeNull();
  });
});
