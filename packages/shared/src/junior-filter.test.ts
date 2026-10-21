import { describe, expect, it } from 'vitest';
import { detectRequiredYears, passesJuniorFilter } from './junior-filter';

describe('passesJuniorFilter', () => {
  it('écarte un titre « senior » pour un débutant', () => {
    expect(passesJuniorFilter({ title: 'Développeur Senior' }, 'debutant').kept).toBe(false);
  });

  it('écarte « confirmé » seulement pour débutant / moins de 1 an', () => {
    expect(passesJuniorFilter({ title: 'Développeur confirmé' }, 'debutant').kept).toBe(false);
    expect(passesJuniorFilter({ title: 'Développeur confirmé' }, '1_a_3_ans').kept).toBe(true);
  });

  it('ne touche jamais une offre d\'alternance, de stage ou junior', () => {
    expect(passesJuniorFilter({ title: 'Développeur senior en alternance' }, 'debutant').kept).toBe(true);
    expect(passesJuniorFilter({ title: 'Stage développeur' }, 'debutant').kept).toBe(true);
    expect(passesJuniorFilter({ title: 'Développeur junior' }, 'debutant').kept).toBe(true);
  });

  it('ne considère pas « manager » ni « responsable » comme exclusion', () => {
    expect(passesJuniorFilter({ title: 'Community Manager' }, 'debutant').kept).toBe(true);
    expect(passesJuniorFilter({ title: 'Responsable commercial en alternance' }, 'debutant').kept).toBe(true);
  });

  it('écarte selon l\'expérience exigée dans le texte', () => {
    const r = passesJuniorFilter(
      { title: 'Développeur web', description: '5 ans d\'expérience minimum exigés' },
      'debutant',
    );
    expect(r.kept).toBe(false);
  });

  it('accepte 3 ans pour le niveau 1 à 3 ans mais écarte 5 ans', () => {
    expect(passesJuniorFilter({ title: 'Dev', description: 'expérience de 3 ans' }, '1_a_3_ans').kept).toBe(true);
    expect(passesJuniorFilter({ title: 'Dev', description: 'expérience de 5 ans' }, '1_a_3_ans').kept).toBe(false);
  });

  it('désactive le filtre pour « plus de 3 ans »', () => {
    expect(passesJuniorFilter({ title: 'Développeur Senior' }, 'plus_3_ans').kept).toBe(true);
  });
});

describe('detectRequiredYears', () => {
  it('lit les années dans des formulations courantes', () => {
    expect(detectRequiredYears("5 ans d'expérience minimum")).toBe(5);
    expect(detectRequiredYears('expérience de 3 ans')).toBe(3);
    expect(detectRequiredYears('débutant accepté')).toBe(0);
  });
});
