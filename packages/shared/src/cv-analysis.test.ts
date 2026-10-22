import { describe, expect, it } from 'vitest';
import { analyzeCvByRules, jobKeywordsFromLabels } from './cv-analysis';

/** Un CV « complet » type junior développeur, pour servir de base aux tests. */
const GOOD_CV = `
Jean Dupont — Développeur web
jean.dupont@gmail.com · 06 12 34 56 78 · linkedin.com/in/jeandupont · github.com/jeandupont

Expériences
2023 - 2024 : Alternance développeur chez Acme. +20 % de performance sur l'API.

Formation
2021 - 2023 : BTS SIO

Compétences
JavaScript, TypeScript, React, SQL

Langues
Anglais B2
`;

describe('jobKeywordsFromLabels', () => {
  it('découpe les libellés en mots-clés significatifs, sans accents ni mots vides', () => {
    expect(jobKeywordsFromLabels(['Développeur web'])).toEqual(['developpeur', 'web']);
    expect(jobKeywordsFromLabels(['Chargé de communication'])).toEqual(['charge', 'communication']);
  });

  it('déduplique', () => {
    expect(jobKeywordsFromLabels(['Développeur web', 'Développeur mobile'])).toEqual([
      'developpeur',
      'web',
      'mobile',
    ]);
  });
});

describe('analyzeCvByRules', () => {
  it('donne un bon score à un CV complet', () => {
    const r = analyzeCvByRules(GOOD_CV, jobKeywordsFromLabels(['Développeur web']));
    expect(r.score).toBeGreaterThanOrEqual(90);
    expect(r.tips.every((t) => t.level === 'ok')).toBe(true);
  });

  it('détecte l’absence d’email, de téléphone et de LinkedIn', () => {
    const r = analyzeCvByRules('Expériences Formation Compétences Langues 2022');
    const warns = r.tips.filter((t) => t.level === 'warn').map((t) => t.message);
    expect(warns.some((m) => m.includes('email'))).toBe(true);
    expect(warns.some((m) => m.includes('téléphone'))).toBe(true);
    expect(warns.some((m) => m.includes('LinkedIn'))).toBe(true);
  });

  it('range les conseils à améliorer (⚠️) avant les ✅', () => {
    const r = analyzeCvByRules('contact@mail.com');
    const firstWarn = r.tips.findIndex((t) => t.level === 'warn');
    const firstOk = r.tips.findIndex((t) => t.level === 'ok');
    if (firstWarn !== -1 && firstOk !== -1) expect(firstWarn).toBeLessThan(firstOk);
  });

  it('repère les formulations creuses', () => {
    const r = analyzeCvByRules('Je suis motivé, dynamique et rigoureux. contact@mail.com');
    expect(r.tips.some((t) => t.level === 'warn' && t.message.includes('creuses'))).toBe(true);
  });

  it('signale les mots-clés du métier absents', () => {
    const r = analyzeCvByRules('Expériences diverses. contact@mail.com', jobKeywordsFromLabels(['Infirmier']));
    expect(r.tips.some((t) => t.level === 'warn' && t.message.includes('métier'))).toBe(true);
  });

  it('n’applique la règle GitHub/portfolio que pour les métiers tech/design', () => {
    const base = 'Expériences Formation Compétences Langues 2022 contact@mail.com';
    const tech = analyzeCvByRules(base, jobKeywordsFromLabels(['Développeur web']));
    const rh = analyzeCvByRules(base, jobKeywordsFromLabels(['Assistant RH']));
    expect(tech.tips.some((t) => t.message.includes('GitHub'))).toBe(true);
    expect(rh.tips.some((t) => t.message.includes('GitHub'))).toBe(false);
  });

  it('alerte sur un CV trop long', () => {
    const long = ('mot '.repeat(1200) + ' contact@mail.com').trim();
    const r = analyzeCvByRules(long);
    expect(r.estimatedPages).toBeGreaterThan(2);
    expect(r.tips.some((t) => t.level === 'warn' && t.message.includes('long'))).toBe(true);
  });
});
