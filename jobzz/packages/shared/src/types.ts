import type { Plan, Role } from './constants';

/** Représentation publique d'un utilisateur, renvoyée au front (jamais de hash ni de secret). */
export interface PublicUser {
  id: string;
  email: string;
  role: Role;
  plan: Plan;
  premiumUntil: string | null;
  emailVerified: boolean;
  offerMailEnabled: boolean;
}

/** Réponse d'authentification : jeton d'accès court + utilisateur. Le refresh est en cookie httpOnly. */
export interface AuthResponse {
  accessToken: string;
  user: PublicUser;
}
