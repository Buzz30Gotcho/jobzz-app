import { describe, expect, it } from 'vitest';
import { buildAlertQuery } from './start';

const spec = { metiers: ['développeur back-end', 'développeur java'], contractWord: 'alternance', excludeWords: ['senior', 'head of'] };

describe('buildAlertQuery (exercice 06)', () => {
  it('avec opérateurs : guillemets, OR et exclusions', () => {
    const q = buildAlertQuery(spec, true);
    expect(q).toContain('alternance');
    expect(q).toContain('("développeur back-end" OR "développeur java")');
    expect(q).toContain('-senior');
    expect(q).toContain('-"head of"');
  });

  it('sans opérateurs : contrat + premier métier seulement', () => {
    expect(buildAlertQuery(spec, false)).toBe('alternance développeur back-end');
  });

  it('sans contrat ni métier avec opérateurs : chaîne vide', () => {
    expect(buildAlertQuery({ metiers: [], excludeWords: [] }, true)).toBe('');
  });
});
