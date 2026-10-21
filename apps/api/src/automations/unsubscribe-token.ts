import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Jeton de désinscription en un clic (CLAUDE.md §4.6) : `userId.signatureHMAC`. Signé avec un
 * secret serveur, vérifié à durée illimitée (il ne coupe que le mail des offres, sans toucher au
 * compte). Fonctions pures, testées.
 */
function sign(userId: string, secret: string): string {
  return createHmac('sha256', secret).update(userId).digest('base64url');
}

export function signUnsubscribeToken(userId: string, secret: string): string {
  return `${Buffer.from(userId).toString('base64url')}.${sign(userId, secret)}`;
}

export function verifyUnsubscribeToken(token: string, secret: string): string | null {
  const [encodedId, signature] = token.split('.');
  if (!encodedId || !signature) return null;
  let userId: string;
  try {
    userId = Buffer.from(encodedId, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  const expected = sign(userId, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return userId;
}
