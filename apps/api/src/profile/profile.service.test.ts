import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service';
import { ProfileService } from './profile.service';

/** Prisma simulé : juste ce que ProfileService appelle. */
function fakePrisma(profileRow: unknown, cvCount = 0): PrismaService {
  return {
    profile: {
      findUnique: vi.fn().mockResolvedValue(profileRow),
      upsert: vi.fn().mockResolvedValue(profileRow),
    },
    cvDocument: {
      count: vi.fn().mockResolvedValue(cvCount),
    },
  } as unknown as PrismaService;
}

describe('ProfileService.get', () => {
  it('profil inexistant → forme vide valide avec complétude 0 %', async () => {
    const service = new ProfileService(fakePrisma(null));
    const profile = await service.get('u1');
    expect(profile.jobTargets).toEqual([]);
    expect(profile.firstName).toBeNull();
    expect(profile.completion.percent).toBe(0);
  });

  it('normalise les champs JSON et convertit la date de début en AAAA-MM-JJ', async () => {
    const row = {
      firstName: 'Fred',
      lastName: null,
      phone: null,
      linkedinUrl: null,
      links: [],
      jobTargets: [{ label: 'Développeur web', romeCodes: ['M1805'] }],
      skills: ['TypeScript'],
      sectors: [],
      locations: [{ communeCode: '34172', label: 'Montpellier', lat: 43.6, lng: 3.8, radiusKm: 30 }],
      remotePreference: 'accepte',
      educationLevel: null,
      educationField: null,
      availableFrom: new Date('2027-01-15T00:00:00.000Z'),
      contractTypes: ['alternance'],
      alternance: { rythme: '3/1', dureeMois: 12, ecole: null },
      internship: null,
      experienceLevel: 'debutant',
    };
    const service = new ProfileService(fakePrisma(row, 1));
    const profile = await service.get('u1');

    expect(profile.firstName).toBe('Fred');
    expect(profile.availableFrom).toBe('2027-01-15');
    expect(profile.jobTargets[0].romeCodes).toEqual(['M1805']);
    expect(profile.completion.items.find((i) => i.key === 'cv')?.done).toBe(true);
    // Métier + contrat + lieu + date + compétences + CV + LinkedIn(non) + télétravail + secteurs(non)
    expect(profile.completion.percent).toBeGreaterThan(50);
  });
});
