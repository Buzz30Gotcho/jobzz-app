import { describe, expect, it } from 'vitest';
import { buildAlertQuery, generateAlertHelpers, ALERT_SITES, type AlertSpec } from './alert-helpers';

const spec: AlertSpec = {
  metiers: ['développeur back-end', 'développeur java'],
  contractWord: 'alternance',
  excludeWords: ['senior', 'confirmé'],
  locationLabel: 'Montpellier',
  radiusKm: 30,
};

describe('buildAlertQuery', () => {
  it('utilise guillemets, OR et exclusions quand le site gère les opérateurs (Indeed)', () => {
    const q = buildAlertQuery(spec, true);
    expect(q).toContain('alternance');
    expect(q).toContain('("développeur back-end" OR "développeur java")');
    expect(q).toContain('-senior');
    expect(q).toContain('-confirmé'); // pas de guillemets : un seul mot
    // Un mot d'exclusion avec espace serait mis entre guillemets.
    expect(buildAlertQuery({ metiers: [], excludeWords: ['head of'] }, true)).toContain('-"head of"');
  });

  it('se limite à des mots-clés simples quand le site ne gère pas les opérateurs', () => {
    const q = buildAlertQuery(spec, false);
    expect(q).toBe('alternance développeur back-end');
    expect(q).not.toContain('OR');
    expect(q).not.toContain('-senior');
  });
});

describe('generateAlertHelpers', () => {
  it('génère une suggestion par site, avec requête, URL et filtres', () => {
    const suggestions = generateAlertHelpers(spec);
    expect(suggestions.length).toBe(ALERT_SITES.length);
    const indeed = suggestions.find((s) => s.site === 'indeed')!;
    expect(indeed.url).toContain('fr.indeed.com/jobs?q=');
    expect(indeed.url).toContain('radius=30');
    expect(indeed.filters.some((f) => f.includes('Montpellier'))).toBe(true);
    expect(indeed.query.length).toBeGreaterThan(0);
  });

  it('encode correctement le lieu et la requête', () => {
    const [first] = generateAlertHelpers({ metiers: ['chargé de communication'], excludeWords: [], locationLabel: 'Saint-Étienne' });
    expect(first.url).toContain('Saint-%C3%89tienne');
  });
});
