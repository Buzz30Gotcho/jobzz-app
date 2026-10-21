import { createHash, randomBytes } from 'node:crypto';

/**
 * Jetons opaques (rafraîchissement, vérification d'email, réinitialisation).
 * On envoie la valeur en clair à l'utilisateur mais on ne stocke que son empreinte SHA-256
 * (cf. CLAUDE.md §4.1, §9) : jamais de jeton en clair en base.
 */
export function generateOpaqueToken(bytes = 48): string {
  return randomBytes(bytes).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
