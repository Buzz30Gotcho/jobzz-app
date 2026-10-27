import { describe, expect, it } from 'vitest';
import { parseFaq } from './faq';

describe('parseFaq', () => {
  it('découpe le Markdown en questions/réponses et ignore le titre', () => {
    const md = `# Questions fréquentes

## Première question ?

Une réponse sur
plusieurs lignes.

## Deuxième question ?

Autre réponse.`;
    const entries = parseFaq(md);
    expect(entries).toHaveLength(2);
    expect(entries[0].question).toBe('Première question ?');
    expect(entries[0].answer).toBe('Une réponse sur\nplusieurs lignes.');
    expect(entries[1].question).toBe('Deuxième question ?');
  });

  it('ignore une section sans réponse', () => {
    expect(parseFaq('## Vide ?\n\n')).toHaveLength(0);
  });
});
