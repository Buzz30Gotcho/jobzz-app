/**
 * Configuration métier de Jobzz — SOURCE UNIQUE des valeurs par défaut.
 *
 * Toutes les valeurs métier du cahier des charges vivent ici (délais de relance, limites
 * des offres, poids et seuils du score, fréquence des automatisations, écart entre mails,
 * heures calmes, nombres d'offres par mail, délais IA, tailles de fichiers…).
 * Le back-end et le front-end importent cette configuration ; rien n'est codé « en dur »
 * ailleurs. Les secrets et les valeurs propres à l'environnement restent dans `.env`.
 */

/** Fuseau des règles métier (week-ends, heures calmes, échéances). Les dates sont en UTC en base. */
export const BUSINESS_TIMEZONE = 'Europe/Paris' as const;

/** Relances (candidatures). */
export const FOLLOW_UP = {
  /** Jours après la candidature avant d'apparaître dans « À buzzer ». */
  delayDays: 7,
  /** Une échéance tombant un samedi/dimanche est décalée au lundi. */
  shiftWeekendToMonday: true,
} as const;

/** Authentification et sécurité. */
export const AUTH = {
  passwordMinLength: 10,
  accessTokenTtl: '15m',
  /** Durée du jeton de rafraîchissement (jours). */
  refreshTokenTtlDays: 30,
  /** Validité du lien de vérification d'email (heures). */
  emailVerifyTtlHours: 48,
  /** Nombre maximum de renvois du mail de vérification par heure. */
  emailVerifyMaxPerHour: 3,
  /** Validité du lien de réinitialisation de mot de passe (heures). */
  passwordResetTtlHours: 1,
} as const;

/** Limites du plan Gratuit (appliquées seulement si PLAN_ENFORCEMENT=true). */
export const FREE_LIMITS = {
  /** Offres lisibles par jour en recherche manuelle. */
  offersViewedPerDay: 25,
  /** Envois libres par semaine. */
  freeSendsPerWeek: 5,
  /** Analyses du CV par règles, par mois. */
  cvRulesAnalysisPerMonth: 1,
  /** Comparaisons CV ↔ offre par règles, par jour. */
  cvOfferComparisonPerDay: 1,
  /** Automatisations actives. */
  activeAutomations: 1,
} as const;

/** Limites du plan Premium. */
export const PREMIUM_LIMITS = {
  /** Messages (relance / envoi libre) rédigés par l'IA, par jour. */
  aiMessagesPerDay: 30,
  /** Analyses du CV par l'IA, par jour. */
  cvAiAnalysisPerDay: 3,
  /** Conseils IA pour adapter le CV à une offre, par jour. */
  cvOfferAiAdvicePerDay: 10,
  /** Automatisations actives simultanées. */
  activeAutomations: 5,
} as const;

/** Automatisations. */
export const AUTOMATIONS = {
  /** Fréquence de la tâche `automations.tick`. */
  tickEveryMinutes: 60,
  /** Score minimum par défaut pour qu'une offre soit envoyée. */
  defaultMinScore: 60,
  /** Fraîcheur de publication par défaut (jours). */
  defaultFreshnessDays: 14,
  /** Échecs complets consécutifs avant de passer en statut `erreur`. */
  failuresBeforeError: 3,
  /** Nombre d'offres soumises à l'ajustement IA (les meilleures). */
  aiAdjustmentTopN: 30,
  /** Automatisation découverte (gratuit) : offres par mail hebdomadaire. */
  discoveryOffersPerMail: 5,
  /** Automatisation découverte : fenêtre d'offres « fraîches » privilégiées (jours). */
  discoveryFreshDays: 4,
  /** Jour et heure (Europe/Paris) de l'envoi hebdomadaire gratuit. */
  discoveryWeeklyDay: 1, // lundi (1 = lundi, 0 = dimanche)
  discoveryWeeklyHour: 8,
} as const;

/** Mail des offres (Premium). */
export const OFFER_MAIL = {
  /** Heures minimum entre deux mails. */
  minHoursBetweenMails: 4,
  /** Pas d'envoi entre ces heures (Europe/Paris). */
  quietHoursStart: 22,
  quietHoursEnd: 7,
  /** Offres maximum par automatisation. */
  maxOffersPerAutomation: 5,
  /** Offres maximum par mail (toutes automatisations confondues). */
  maxOffersPerMail: 15,
} as const;

/** Recherche manuelle d'offres. */
export const SEARCH = {
  /** Âge maximum d'une offre affichée (jours). */
  maxOfferAgeDays: 30,
  /** Score minimum affiché. */
  minDisplayedScore: 40,
  /** Taille de page. */
  pageSize: 20,
  /** Fenêtre de compatibilité de la date de début : avant / après la disponibilité (jours). */
  startDateWindowBeforeDays: 15,
  startDateWindowAfterDays: 90,
} as const;

/**
 * Poids et sous-scores du score de compatibilité (déterministe).
 * `score = 100 × Σ(poids × sous-score) / Σ(poids applicables)`, borné 0–100.
 */
export const SCORING = {
  weights: {
    skills: 50,
    job: 20,
    location: 10,
    startDate: 10,
    rhythmDurationExperience: 10,
  },
  /** Bonus de préférences maximum (automatisations). */
  maxPreferenceBonus: 10,
  /** Amplitude de l'ajustement IA (± points). */
  aiAdjustmentRange: 15,
  /** Seuils des libellés. */
  labels: {
    excellent: 80, // ≥ 80 « Excellent match »
    good: 60, // 60–79 « Bon match »
    explore: 40, // 40–59 « À explorer » ; < 40 non affiché
  },
} as const;

/** Fichiers (CV, pièces jointes). */
export const FILES = {
  cvMaxBytes: 5 * 1024 * 1024, // 5 Mo
  ticketAttachmentMaxBytes: 2 * 1024 * 1024, // 2 Mo
  cvAllowedMimeTypes: ['application/pdf'] as const,
  ticketAttachmentMimeTypes: ['image/png', 'image/jpeg', 'image/webp'] as const,
} as const;

/** Intelligence artificielle. */
export const AI = {
  /** Délai maximum pour analyser une demande d'automatisation (ms). */
  automationAnalysisTimeoutMs: 45_000,
  /** Délai maximum pour générer un message (ms). */
  messageTimeoutMs: 30_000,
  /** Confiance minimale pour exclure sur un critère approximatif en mode obligatoire. */
  approximateExclusionConfidence: 0.7,
} as const;

/** Caches (durées). */
export const CACHE = {
  manualSearchSeconds: 10 * 60, // 10 min
  referentialsDays: 7,
  companyEnrichmentDays: 30,
} as const;

/** Prix (modifiables ; activés à la mise en ligne). Montants en euros. */
export const PRICING = {
  monthly: 9.99,
  pass3Months: 24.99,
  launch: 6,
  /** Nombre de places de l'offre de lancement. */
  launchSeats: 100,
  /** Durée du Pass (mois). */
  passDurationMonths: 3,
  /** Préavis avant la fin du Pass (jours). */
  passEndingNoticeDays: 7,
} as const;

/** Nettoyage : purge des lignes OfferView plus anciennes que N jours. */
export const RETENTION = {
  offerViewDays: 7,
} as const;
