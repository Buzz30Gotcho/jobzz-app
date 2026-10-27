import type { ExperienceLevel, SubscriptionOffer } from './constants';

/**
 * Calculs purs des statistiques de l'admin (CLAUDE.md §4.11, §13), testés unitairement.
 * Les requêtes temporelles (comptages par fenêtre) restent dans le service ; ici on ne met
 * que la mise en forme agrégée, réutilisable et vérifiable.
 */

export interface Trend {
  /** Variation en pourcentage vs la période précédente, `null` si non calculable. */
  deltaPercent: number | null;
  direction: 'up' | 'down' | 'flat';
  /** Phrase prête à afficher, ex. « +12 % vs semaine dernière ». */
  label: string;
}

/** Évolution d'un chiffre par rapport à la semaine précédente. */
export function computeTrend(current: number, previous: number): Trend {
  if (previous === 0) {
    if (current === 0) return { deltaPercent: 0, direction: 'flat', label: '—' };
    return { deltaPercent: null, direction: 'up', label: 'nouveau vs semaine dernière' };
  }
  const delta = Math.round(((current - previous) / previous) * 100);
  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  const sign = delta > 0 ? '+' : '';
  return { deltaPercent: delta, direction, label: `${sign}${delta} % vs semaine dernière` };
}

export interface SubscriptionPeriodLike {
  startedAt: Date | string;
  endedAt: Date | string | null;
}

/** Durée moyenne d'abonnement en jours (périodes en cours comptées jusqu'à `now`). `null` si aucune. */
export function averageSubscriptionDurationDays(
  periods: SubscriptionPeriodLike[],
  now: Date = new Date(),
): number | null {
  if (periods.length === 0) return null;
  const totalDays = periods.reduce((sum, p) => {
    const start = new Date(p.startedAt).getTime();
    const end = p.endedAt ? new Date(p.endedAt).getTime() : now.getTime();
    return sum + Math.max(0, end - start) / (1000 * 60 * 60 * 24);
  }, 0);
  return Math.round(totalDays / periods.length);
}

export interface JobOutcomeLike {
  contractType: string;
  helpfulness: string | null;
  cancelledAt: Date | string | null;
}

export interface JobOutcomeSummary {
  total: number;
  byContract: Record<string, number>;
  helpfulness: { beaucoup: number; un_peu: number; pas_vraiment: number };
}

/** Agrège les « J'ai trouvé ! » (ignore les annulés) par type de contrat et par ressenti. */
export function summarizeJobOutcomes(outcomes: JobOutcomeLike[]): JobOutcomeSummary {
  const summary: JobOutcomeSummary = {
    total: 0,
    byContract: {},
    helpfulness: { beaucoup: 0, un_peu: 0, pas_vraiment: 0 },
  };
  for (const o of outcomes) {
    if (o.cancelledAt) continue;
    summary.total += 1;
    summary.byContract[o.contractType] = (summary.byContract[o.contractType] ?? 0) + 1;
    if (o.helpfulness === 'beaucoup') summary.helpfulness.beaucoup += 1;
    else if (o.helpfulness === 'un_peu') summary.helpfulness.un_peu += 1;
    else if (o.helpfulness === 'pas_vraiment') summary.helpfulness.pas_vraiment += 1;
  }
  return summary;
}

// ─────────────────────────── Types des payloads admin ───────────────────────────

export interface AdminMetric {
  value: number;
  previous: number;
  trend: Trend;
}

export interface AdminStats {
  headline: {
    usersTotal: AdminMetric;
    activeThisWeek: AdminMetric;
    newThisWeek: AdminMetric;
    premium: AdminMetric;
  };
  newUsersByWeek: { week: string; count: number }[];
  activeUsers: { d7: number; d30: number };
  premiumBreakdown: Record<SubscriptionOffer, number>;
  avgSubscriptionDays: number | null;
  interviews: number;
  jobOutcomes: JobOutcomeSummary;
  experienceDistribution: Record<ExperienceLevel, number>;
  usage: { activeAutomations: number; offerMailsSent: number; followUpsSent: number };
  hasSubscriptions: boolean;
}

export type HealthState = 'ok' | 'degraded' | 'down';

export interface AdminHealth {
  api: HealthState;
  database: HealthState;
  jobSourcesMode: string;
  planEnforcement: boolean;
  ai: { enabled: boolean; calls24h: number; successRate: number | null; avgMs: number | null };
  automations24h: { success: number; partial: number; failed: number };
  offerMailsToday: number;
  usersTotal: number;
  activeAutomations: number;
  /** Nombre de tâches en attente dans pg-boss, `null` si non lisible. */
  queuePending: number | null;
}

export interface AdminUserRow {
  id: string;
  email: string;
  createdAt: string;
  plan: string;
  premiumUntil: string | null;
  disabled: boolean;
  applicationCount: number;
  automationCount: number;
}

export interface AdminUserList {
  users: AdminUserRow[];
  total: number;
}
