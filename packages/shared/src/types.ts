import type { ContractType, ExperienceLevel, Plan, RemotePreference, Role } from './constants';
import type {
  AlternanceDetails,
  InternshipDetails,
  JobTarget,
  ProfileLocation,
} from './schemas/profile';
import type { ProfileCompletion } from './profile-completion';

/** Représentation publique d'un utilisateur, renvoyée au front (jamais de hash ni de secret). */
export interface PublicUser {
  id: string;
  email: string;
  role: Role;
  plan: Plan;
  premiumUntil: string | null;
  emailVerified: boolean;
  offerMailEnabled: boolean;
  /** Prénom facultatif (profil) : sert à personnaliser l'accueil. `null` si non renseigné. */
  firstName: string | null;
}

/** Réponse d'authentification : jeton d'accès court + utilisateur. Le refresh est en cookie httpOnly. */
export interface AuthResponse {
  accessToken: string;
  user: PublicUser;
}

/** Profil renvoyé au front (GET /profile) : données normalisées + complétude calculée. */
export interface PublicProfile {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  links: string[];
  jobTargets: JobTarget[];
  skills: string[];
  sectors: string[];
  locations: ProfileLocation[];
  remotePreference: RemotePreference | null;
  educationLevel: string | null;
  educationField: string | null;
  /** Date de début au format `YYYY-MM-DD`, ou `null`. */
  availableFrom: string | null;
  contractTypes: ContractType[];
  alternance: AlternanceDetails | null;
  internship: InternshipDetails | null;
  experienceLevel: ExperienceLevel | null;
  completion: ProfileCompletion;
}
