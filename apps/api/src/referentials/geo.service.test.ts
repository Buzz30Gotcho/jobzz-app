import { describe, expect, it } from 'vitest';
import { mapGeoCommunes } from './geo.service';

// Réponse enregistrée de geo.api.gouv.fr (extrait), pour tester le mapping sans appel réseau.
const SAMPLE = [
  {
    nom: 'Montpellier',
    code: '34172',
    codesPostaux: ['34000', '34070', '34080', '34090'],
    centre: { type: 'Point', coordinates: [3.8767, 43.6109] },
    departement: { code: '34', nom: 'Hérault' },
  },
  {
    nom: 'Montpellier-de-Médillan',
    code: '17242',
    codesPostaux: ['17260'],
    centre: { type: 'Point', coordinates: [-0.69, 45.62] },
    departement: { code: '17', nom: 'Charente-Maritime' },
  },
];

describe('mapGeoCommunes', () => {
  it('normalise les communes (code INSEE, département, coordonnées)', () => {
    const [first] = mapGeoCommunes(SAMPLE);
    expect(first).toEqual({
      code: '34172',
      label: 'Montpellier',
      postalCode: '34000',
      departement: '34',
      lng: 3.8767,
      lat: 43.6109,
    });
  });

  it('ignore les entrées incomplètes et les formes inattendues', () => {
    expect(mapGeoCommunes(null)).toEqual([]);
    expect(mapGeoCommunes([{ nom: 'Sans code' }])).toEqual([]);
    expect(mapGeoCommunes([{ code: '00000', nom: 'Sans centre' }])).toEqual([
      { code: '00000', label: 'Sans centre', postalCode: null, departement: null, lng: null, lat: null },
    ]);
  });
});
