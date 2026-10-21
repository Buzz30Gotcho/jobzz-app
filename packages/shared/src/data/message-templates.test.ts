import { describe, expect, it } from 'vitest';
import { renderMessage, renderTemplate } from './message-templates';

describe('renderTemplate', () => {
  it('remplace les variables connues et vide les inconnues', () => {
    expect(renderTemplate('Bonjour {prenom} chez {entreprise}', { prenom: 'Fred', entreprise: 'Acme' })).toBe(
      'Bonjour Fred chez Acme',
    );
    expect(renderTemplate('Poste {poste}', {})).toBe('Poste ');
  });
});

describe('renderMessage', () => {
  it('rend une relance avec les variables injectées', () => {
    const { subject, body } = renderMessage('relance', {
      poste: 'Développeur',
      entreprise: 'Acme',
      date_candidature: '12/10/2026',
      signature: 'Fred — 06 12 34 56 78',
    });
    expect(subject).toBe('Relance — candidature Développeur');
    expect(body).toContain('Développeur');
    expect(body).toContain('Acme');
    expect(body).toContain('Fred — 06 12 34 56 78');
    // Pas de variable non substituée.
    expect(body).not.toMatch(/\{\w+\}/);
  });

  it('le message LinkedIn reste court (< 300 caractères)', () => {
    const { body } = renderMessage('linkedin', { poste: 'Vendeur', entreprise: 'Boutique', prenom: 'Fred' });
    expect(body.length).toBeLessThan(300);
  });
});
