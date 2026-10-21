import { describe, expect, it } from 'vitest';
import { AUTOMATION_SCHEMA_VERSION, automationCriteriaSchema, automationInputSchema } from './automation';

describe('automationCriteriaSchema', () => {
  it('applique les valeurs par défaut (version, fraîcheur, score, télétravail)', () => {
    const c = automationCriteriaSchema.parse({});
    expect(c.schemaVersion).toBe(AUTOMATION_SCHEMA_VERSION);
    expect(c.fraicheurJours).toBe(14);
    expect(c.scoreMin).toBe(60);
    expect(c.teletravail).toBe('indifferent');
    expect(c.metiers).toEqual([]);
  });

  it('valide les codes ROME des métiers et refuse un contrat inconnu', () => {
    expect(
      automationCriteriaSchema.safeParse({ metiers: [{ label: 'Dev', romeCodes: ['M1805'] }] }).success,
    ).toBe(true);
    expect(automationCriteriaSchema.safeParse({ contrats: ['freelance'] }).success).toBe(false);
  });

  it('exige un nom dans automationInputSchema', () => {
    expect(automationInputSchema.safeParse({ name: '', criteria: {} }).success).toBe(false);
    expect(automationInputSchema.safeParse({ name: 'Alternance dev', criteria: {} }).success).toBe(true);
  });
});
