import { describe, expect, it } from 'vitest';
import { normalizeEmail } from './normalize-email';
import { loginSchema, registerSchema } from './schemas/auth';

describe('normalizeEmail', () => {
  it('« Fred@Gmail.com » et « fred@gmail.com » correspondent au même compte', () => {
    expect(normalizeEmail('Fred@Gmail.com')).toBe(normalizeEmail('fred@gmail.com'));
    expect(normalizeEmail('Fred@Gmail.com')).toBe('fred@gmail.com');
  });

  it('retire les espaces du début et de la fin', () => {
    expect(normalizeEmail('  fred@gmail.com  ')).toBe('fred@gmail.com');
    expect(normalizeEmail('\tFred@Gmail.com\n')).toBe('fred@gmail.com');
  });

  it('est idempotent', () => {
    const once = normalizeEmail('  Fred@Gmail.COM ');
    expect(normalizeEmail(once)).toBe(once);
  });
});

describe('schémas d’authentification', () => {
  it('registerSchema normalise l’email avant validation', () => {
    const a = registerSchema.parse({ email: '  Fred@Gmail.com ', password: 'motdepasse10' });
    const b = registerSchema.parse({ email: 'fred@gmail.com', password: 'motdepasse10' });
    expect(a.email).toBe('fred@gmail.com');
    expect(a.email).toBe(b.email);
  });

  it('loginSchema normalise aussi l’email', () => {
    const parsed = loginSchema.parse({ email: 'FRED@GMAIL.COM', password: 'motdepasse10' });
    expect(parsed.email).toBe('fred@gmail.com');
  });
});
