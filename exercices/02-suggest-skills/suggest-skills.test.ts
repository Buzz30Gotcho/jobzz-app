import { describe, expect, it } from 'vitest';
import { GENERIC_SKILLS, suggestSkills } from './start';

describe('suggestSkills (exercice 02)', () => {
  it('reconnaît le domaine dev malgré les accents', () => {
    const skills = suggestSkills(['Développeur web']);
    expect(skills).toContain('TypeScript');
    expect(skills).toContain('SQL');
  });

  it('ajoute toujours les génériques', () => {
    const skills = suggestSkills(['Développeur']);
    expect(skills).toContain('Anglais');
  });

  it('métier inconnu → uniquement les génériques', () => {
    expect(suggestSkills(['Astronaute'])).toEqual(GENERIC_SKILLS);
  });

  it('dédoublonne et respecte max', () => {
    const skills = suggestSkills(['Développeur', 'web informatique'], 4);
    expect(skills.length).toBe(4);
    expect(new Set(skills).size).toBe(skills.length);
  });

  it('fusionne plusieurs domaines', () => {
    const skills = suggestSkills(['Développeur', 'Chargé de recrutement'], 50);
    expect(skills).toContain('Git');
    expect(skills).toContain('Recrutement');
  });
});
