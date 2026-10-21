import { describe, expect, it } from 'vitest';
import { signUnsubscribeToken, verifyUnsubscribeToken } from './unsubscribe-token';

describe('jeton de désinscription', () => {
  const secret = 'un-secret-de-test-assez-long';

  it('un jeton signé est vérifié et renvoie le userId', () => {
    const token = signUnsubscribeToken('user-123', secret);
    expect(verifyUnsubscribeToken(token, secret)).toBe('user-123');
  });

  it('refuse un jeton falsifié ou un mauvais secret', () => {
    const token = signUnsubscribeToken('user-123', secret);
    expect(verifyUnsubscribeToken(token, 'autre-secret')).toBeNull();
    expect(verifyUnsubscribeToken('nimporte.quoi', secret)).toBeNull();
    expect(verifyUnsubscribeToken(token + 'x', secret)).toBeNull();
  });
});
