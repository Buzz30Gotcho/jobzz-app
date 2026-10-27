import { z } from 'zod';
import { AUTH } from '../config';

/**
 * Schémas liés au compte connecté : changement de mot de passe, interrupteur du
 * mail des offres, suppression du compte (CLAUDE.md §4.1, §4.2, §4.12).
 */

const newPassword = z
  .string()
  .min(
    AUTH.passwordMinLength,
    `Le mot de passe doit faire au moins ${AUTH.passwordMinLength} caractères`,
  )
  .max(200);

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis').max(200),
  password: newPassword,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const offerMailSchema = z.object({
  enabled: z.boolean(),
});
export type OfferMailInput = z.infer<typeof offerMailSchema>;

/**
 * Suppression du compte : l'utilisateur retape son email pour confirmer
 * (CLAUDE.md §4.12). La correspondance exacte est vérifiée côté serveur.
 */
export const deleteAccountSchema = z.object({
  confirmEmail: z.string().trim().min(1, 'Retape ton email pour confirmer').max(254),
});
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
