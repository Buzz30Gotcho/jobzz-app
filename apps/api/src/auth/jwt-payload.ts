import type { Plan, Role } from '@jobzz/shared';

/** Contenu du jeton d'accès JWT (court). */
export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: Role;
  plan: Plan;
}

/** Utilisateur présent sur la requête après authentification. */
export interface RequestUser {
  id: string;
  email: string;
  role: Role;
  plan: Plan;
}
