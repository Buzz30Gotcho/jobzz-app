import type {
  ApplicationSource,
  ApplicationStatus,
  ContractType,
  ExperienceLevel,
  FollowUpChannel,
  FollowUpKind,
  Plan,
  RemotePreference,
  ResponseType,
  Role,
} from './constants';
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

/** Une relance enregistrée. */
export interface PublicFollowUp {
  id: string;
  kind: FollowUpKind;
  channel: FollowUpChannel;
  subject: string | null;
  body: string;
  aiGenerated: boolean;
  sentAt: string;
}

/** Une candidature renvoyée au front (dates en ISO). */
export interface PublicApplication {
  id: string;
  companyName: string;
  position: string;
  contactEmail: string | null;
  contactName: string | null;
  appliedAt: string;
  source: ApplicationSource;
  offerUrl: string | null;
  status: ApplicationStatus;
  responseType: ResponseType | null;
  archivedAt: string | null;
  followUpCount: number;
  lastFollowUpAt: string | null;
  nextFollowUpAt: string | null;
  respondedAt: string | null;
  followUps: PublicFollowUp[];
}

/** Résumé du tableau de bord (CLAUDE.md §4.9). Ne contient que ce qui existe à cette étape. */
export interface DashboardSummary {
  firstName: string | null;
  /** Candidatures à relancer aujourd'hui (les plus en retard d'abord). */
  dueFollowUps: PublicApplication[];
  counts: {
    applications: number;
    followUpsSent: number;
    responses: number;
    interviews: number;
  };
  /** Récap des 7 derniers jours. */
  week: {
    followUpsSent: number;
    responses: number;
    interviews: number;
  };
}
