import { describe, expect, it } from 'vitest';
import { mapRomeJobs } from './rome.service';

describe('mapRomeJobs', () => {
  it('normalise les métiers (code + libellé) et dédoublonne', () => {
    const raw = [
      { code: 'M1805', libelle: 'Études et développement informatique' },
      { code: 'M1805', libelle: 'Doublon' },
      { code: 'D1106', libelle: 'Vente en alimentation' },
    ];
    expect(mapRomeJobs(raw)).toEqual([
      { code: 'M1805', label: 'Études et développement informatique' },
      { code: 'D1106', label: 'Vente en alimentation' },
    ]);
  });

  it('ignore les formes inattendues', () => {
    expect(mapRomeJobs(null)).toEqual([]);
    expect(mapRomeJobs([{ code: 'M1805' }, { libelle: 'sans code' }, 42])).toEqual([]);
  });
});
