import { z } from 'zod';
import { AUTH } from '../config';
import { normalizeEmail } from '../normalize-email';

// Normalisation (trim + minuscules) AVANT la validation du format.
const email = z
  .string()
  .transform(normalizeEmail)
  .pipe(z.string().email('Adresse email invalide').max(254));

const password = z
  .string()
  .min(AUTH.passwordMinLength, `Le mot de passe doit faire au moins ${AUTH.passwordMinLength} caractères`)
  .max(200);

export const registerSchema = z.object({
  email,
  password,
  /** Code d'invitation, requis seulement si BETA_INVITE_CODE est configuré côté serveur. */
  inviteCode: z.string().trim().max(100).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Mot de passe requis').max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const requestPasswordResetSchema = z.object({ email });
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const resendVerificationSchema = z.object({ email });
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
