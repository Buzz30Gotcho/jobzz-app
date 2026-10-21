import { describe, expect, it } from 'vitest';
import { sameSkillFamily, skillMatchScore } from './skill-families';

describe('skillMatchScore', () => {
  it('identique présente = 1', () => {
    expect(skillMatchScore('React', ['react', 'sql'])).toBe(1);
  });

  it('même famille = 0,5', () => {
    expect(skillMatchScore('Vue', ['React'])).toBe(0.5);
  });

  it('compétence générique = 0,25', () => {
    expect(skillMatchScore('Anglais', ['React'])).toBe(0.25);
  });

  it('absente = 0', () => {
    expect(skillMatchScore('Docker', ['React'])).toBe(0);
  });
});

describe('sameSkillFamily', () => {
  it('reconnaît les synonymes/technos proches', () => {
    expect(sameSkillFamily('PostgreSQL', 'MySQL')).toBe(true);
    expect(sameSkillFamily('React', 'Java')).toBe(false);
  });
});
