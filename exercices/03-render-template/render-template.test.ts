import { describe, expect, it } from 'vitest';
import { renderTemplate } from './start';

describe('renderTemplate (exercice 03)', () => {
  it('remplace une variable connue', () => {
    expect(renderTemplate('Bonjour {prenom}', { prenom: 'Fred' })).toBe('Bonjour Fred');
  });

  it('remplace plusieurs variables', () => {
    expect(renderTemplate('{a} et {b}', { a: '1', b: '2' })).toBe('1 et 2');
  });

  it('vide une variable absente', () => {
    expect(renderTemplate('Chez {entreprise}', {})).toBe('Chez ');
  });

  it('laisse le texte sans variable intact', () => {
    expect(renderTemplate('Aucune variable ici', {})).toBe('Aucune variable ici');
  });
});
