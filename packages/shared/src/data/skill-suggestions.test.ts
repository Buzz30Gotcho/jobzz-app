import { describe, expect, it } from 'vitest';
import { GENERIC_SKILLS, suggestSkills } from './skill-suggestions';

describe('suggestSkills', () => {
  it('reconnaît le domaine dev et propose des technos (insensible aux accents)', () => {
    const skills = suggestSkills(['Développeur back-end']);
    expect(skills).toContain('TypeScript');
    expect(skills).toContain('SQL');
  });

  it('reconnaît le domaine RH', () => {
    const skills = suggestSkills(['Chargé de recrutement']);
    expect(skills).toContain('Recrutement');
  });

  it('métier inconnu → uniquement les compétences génériques', () => {
    const skills = suggestSkills(['Dompteur de licornes']);
    expect(skills).toEqual(GENERIC_SKILLS);
  });

  it('dédoublonne et respecte la limite max', () => {
    const skills = suggestSkills(['Développeur', 'Développeuse web'], 5);
    expect(skills.length).toBe(5);
    expect(new Set(skills).size).toBe(skills.length);
  });

  it('plusieurs domaines → fusionne les compétences', () => {
    const skills = suggestSkills(['Commercial', 'Marketing digital'], 50);
    expect(skills).toContain('Négociation');
    expect(skills).toContain('SEO');
  });
});
