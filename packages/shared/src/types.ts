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
import type { AutomationCriteria } from './schemas/automation';

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

/** Message généré (par l'IA ou par modèle), renvoyé au front. */
export interface GeneratedMessage {
  subject: string;
  body: string;
  /** Vrai si l'IA a rédigé le message ; faux si on est retombé sur le modèle. */
  aiGenerated: boolean;
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

/** Une automatisation renvoyée au front. */
export interface PublicAutomation {
  id: string;
  name: string;
  requestText: string | null;
  criteria: AutomationCriteria;
  status: 'active' | 'en_pause' | 'erreur';
  summary: string;
  lastRunAt: string | null;
  /** Vrai nombre d'offres envoyées sur 28 jours glissants (0 tant que l'exécution n'est pas branchée). */
  sentLast28Days: number;
  createdAt: string;
}

/** Exemple d'offre affiché dans l'aperçu d'une automatisation (jamais la liste complète). */
export interface AutomationExample {
  title: string;
  companyName: string | null;
  locationLabel: string | null;
  contractType: ContractType | null;
  score: number;
}

/** Aperçu / prévision d'une automatisation (CLAUDE.md §4.6). */
export interface AutomationPreview {
  previsionParSemaine: number;
  funnel: {
    trouvees: number;
    apresMetierLieu: number;
    apresContratDateJunior: number;
    auDessusDuScore: number;
  };
  examples: AutomationExample[];
  notice: string | null;
}

/** Résumé du tableau de bord (CLAUDE.md §4.9). Ne contient que ce qui existe à cette étape. */
/**
 * Carte « Bien démarrer » (CLAUDE.md §4.9) : checklist d'un nouvel utilisateur.
 * `null` quand l'utilisateur l'a masquée (ou que tout est coché et affiché une fois).
 */
export interface StartChecklist {
  done: {
    /** Profil rempli (métier, contrat, ville, date de début). */
    profile: boolean;
    /** Première recherche d'offres (User.firstSearchAt). */
    search: boolean;
    /** Au moins une automatisation. */
    automation: boolean;
    /** Au moins une candidature notée. */
    application: boolean;
    /** CV déposé. */
    cv: boolean;
  };
  completed: number;
  total: number;
  allDone: boolean;
}

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
  /** Carte « Bien démarrer » (nouveaux utilisateurs) ; `null` si masquée. */
  startChecklist: StartChecklist | null;
}
