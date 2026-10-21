import { describe, expect, it } from 'vitest';
import { mapFranceTravailOffers } from './france-travail.source';

// Réponse enregistrée (extrait) de l'API France Travail, pour tester le mapping sans réseau.
const SAMPLE = [
  {
    id: '190ABCD',
    intitule: 'Développeur web H/F',
    description: 'Mission de développement web.',
    romeCode: 'M1805',
    typeContrat: 'CDI',
    alternance: false,
    experienceExige: 'D',
    lieuTravail: { libelle: '34 - Montpellier', commune: '34172', latitude: 43.61, longitude: 3.87 },
    entreprise: { nom: 'Entreprise Test' },
    competences: [{ libelle: 'React' }, { libelle: 'SQL' }],
    salaire: { libelle: '30k€' },
    dateCreation: '2026-10-01T10:00:00.000Z',
    origineOffre: { urlOrigine: 'https://candidat.francetravail.fr/offres/190ABCD' },
  },
  {
    id: '191ZZZ',
    intitule: 'Alternance développeur',
    alternance: true,
    typeContrat: 'CDD',
    lieuTravail: { libelle: 'Paris' },
  },
];

describe('mapFranceTravailOffers', () => {
  it('normalise une offre CDI avec compétences et lieu', () => {
    const [o] = mapFranceTravailOffers(SAMPLE);
    expect(o.source).toBe('franceTravail');
    expect(o.externalId).toBe('190ABCD');
    expect(o.contractType).toBe('cdi');
    expect(o.skills).toEqual(['React', 'SQL']);
    expect(o.communeCode).toBe('34172');
    expect(o.romeCodes).toEqual(['M1805']);
  });

  it('détecte l\'alternance via le drapeau dédié', () => {
    const [, o] = mapFranceTravailOffers(SAMPLE);
    expect(o.contractType).toBe('alternance');
  });

  it('ignore les formes inattendues', () => {
    expect(mapFranceTravailOffers(null)).toEqual([]);
    expect(mapFranceTravailOffers([{ intitule: 'sans id' }])).toEqual([]);
  });
});
