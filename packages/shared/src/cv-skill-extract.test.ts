import { describe, expect, it } from 'vitest';
import { extractSkillsFromCv } from './cv-skill-extract';

describe('extractSkillsFromCv', () => {
  it('trouve les compétences connues présentes dans le CV', () => {
    const cv = 'Développeur : JavaScript, React, SQL. Un peu de Docker.';
    const skills = extractSkillsFromCv(cv);
    expect(skills).toContain('JavaScript');
    expect(skills).toContain('React');
    expect(skills).toContain('SQL');
    expect(skills).toContain('Docker');
  });

  it('ignore la casse et les accents', () => {
    const skills = extractSkillsFromCv('maîtrise de PYTHON et de git');
    expect(skills).toContain('Python');
    expect(skills).toContain('Git');
  });

  it('ne renvoie rien pour un CV sans compétence connue', () => {
    expect(extractSkillsFromCv('Serveur en restauration, accueil clientèle.')).toHaveLength(0);
  });

  it('respecte le maximum', () => {
    const cv = 'JavaScript TypeScript Python Java SQL Git React Angular';
    expect(extractSkillsFromCv(cv, 3)).toHaveLength(3);
  });
});
