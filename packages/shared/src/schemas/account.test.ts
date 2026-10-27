import { describe, expect, it } from 'vitest';
import { changePasswordSchema, deleteAccountSchema, offerMailSchema } from './account';

describe('changePasswordSchema', () => {
  it('accepte un mot de passe actuel non vide et un nouveau assez long', () => {
    const r = changePasswordSchema.safeParse({ currentPassword: 'x', password: 'motdepasse1' });
    expect(r.success).toBe(true);
  });

  it('refuse un nouveau mot de passe trop court', () => {
    const r = changePasswordSchema.safeParse({ currentPassword: 'x', password: 'court' });
    expect(r.success).toBe(false);
  });

  it('refuse un mot de passe actuel vide', () => {
    const r = changePasswordSchema.safeParse({ currentPassword: '', password: 'motdepasse1' });
    expect(r.success).toBe(false);
  });
});

describe('offerMailSchema', () => {
  it('exige un booléen', () => {
    expect(offerMailSchema.safeParse({ enabled: true }).success).toBe(true);
    expect(offerMailSchema.safeParse({ enabled: 'oui' }).success).toBe(false);
  });
});

describe('deleteAccountSchema', () => {
  it('nettoie les espaces autour de l’email de confirmation', () => {
    const r = deleteAccountSchema.safeParse({ confirmEmail: '  Fred@Gmail.com ' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.confirmEmail).toBe('Fred@Gmail.com');
  });

  it('refuse une confirmation vide', () => {
    expect(deleteAccountSchema.safeParse({ confirmEmail: '   ' }).success).toBe(false);
  });
});
