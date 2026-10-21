import { describe, expect, it } from 'vitest';
import { wrapUntrusted } from './start';

describe('wrapUntrusted (exercice 04)', () => {
  it('encadre les champs par des balises <donnees>', () => {
    expect(wrapUntrusted({ entreprise: 'Acme', poste: 'Dev' })).toBe(
      '<donnees>\nentreprise: Acme\nposte: Dev\n</donnees>',
    );
  });

  it('ignore les valeurs vides ou absentes', () => {
    expect(wrapUntrusted({ a: 'x', b: '', c: undefined })).toBe('<donnees>\na: x\n</donnees>');
  });

  it('neutralise les retours à la ligne dans une valeur', () => {
    expect(wrapUntrusted({ note: 'ligne1\nligne2' })).toBe('<donnees>\nnote: ligne1 ligne2\n</donnees>');
  });
});
