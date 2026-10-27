import { Injectable, Logger } from '@nestjs/common';
import {
  averageSubscriptionDurationDays,
  computeTrend,
  summarizeJobOutcomes,
  EXPERIENCE_LEVELS,
  type AdminHealth,
  type AdminStats,
  type AdminUserList,
  type ExperienceLevel,
  type HealthState,
  type Plan,
  type SubscriptionOffer,
} from '@jobzz/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/app-config.service';
import { startOfDayParis } from '../common/time';
import { AutomationRunnerService } from '../automations/automation-runner.service';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly runner: AutomationRunnerService,
  ) {}

  // ─────────────────────────── Santé du système ───────────────────────────

  async health(): Promise<AdminHealth> {
    const now = new Date();
    const since24h = new Date(now.getTime() - DAY_MS);
    const dayStart = startOfDayParis(now);

    let database: HealthState = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'down';
    }

    const [aiCalls, runs, offerMailsToday, usersTotal, activeAutomations] = await Promise.all([
      this.prisma.aiCallLog.findMany({
        where: { createdAt: { gte: since24h } },
        select: { success: true, durationMs: true },
      }),
      this.prisma.automationRun.groupBy({
        by: ['status'],
        where: { startedAt: { gte: since24h } },
        _count: { _all: true },
      }),
      this.prisma.offerDigest.count({ where: { sentAt: { gte: dayStart } } }),
      this.prisma.user.count(),
      this.prisma.automation.count({ where: { status: 'active' } }),
    ]);

    const aiSuccess = aiCalls.filter((c) => c.success).length;
    const avgMs = aiCalls.length
      ? Math.round(aiCalls.reduce((s, c) => s + c.durationMs, 0) / aiCalls.length)
      : null;

    const runCount = (status: string) =>
      runs.find((r) => r.status === status)?._count._all ?? 0;

    return {
      api: 'ok',
      database,
      jobSourcesMode: this.config.get('JOB_SOURCES_MODE'),
      planEnforcement: this.config.planEnforcement,
      ai: {
        enabled: this.config.get('AI_ENABLED'),
        calls24h: aiCalls.length,
        successRate: aiCalls.length ? aiSuccess / aiCalls.length : null,
        avgMs,
      },
      automations24h: {
        success: runCount('success'),
        partial: runCount('partial'),
        failed: runCount('failed'),
      },
      offerMailsToday,
      usersTotal,
      activeAutomations,
      queuePending: await this.queuePending(),
    };
  }

  /** Longueur de la file pg-boss (best-effort : `null` si la table n'est pas lisible). */
  private async queuePending(): Promise<number | null> {
    try {
      const rows = await this.prisma.$queryRawUnsafe<{ pending: number }[]>(
        `SELECT count(*)::int AS pending FROM pgboss.job WHERE state IN ('created','retry','active')`,
      );
      return rows[0]?.pending ?? 0;
    } catch {
      return null;
    }
  }

  /** Déclenche une exécution immédiate des automatisations (bouton admin). */
  runAutomationsNow(): { started: boolean } {
    void this.runner.runAll().catch((error) => {
      this.logger.warn(`Exécution manuelle des automatisations échouée : ${String(error)}`);
    });
    return { started: true };
  }

  // ─────────────────────────── Statistiques ───────────────────────────

  async stats(): Promise<AdminStats> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
    const twoWeeksAgo = new Date(now.getTime() - 14 * DAY_MS);
    const monthAgo = new Date(now.getTime() - 30 * DAY_MS);

    const [
      usersTotal,
      usersTotalWeekAgo,
      newThisWeek,
      newLastWeek,
      activeThisWeek,
      activeLastWeek,
      activeD7,
      activeD30,
      premiumNow,
      premiumWeekAgo,
      periods,
      activePeriods,
      interviews,
      outcomes,
      profiles,
      activeAutomations,
      offerMailsSent,
      followUpsSent,
      subscriptionCount,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { lt: weekAgo } } }),
      this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.user.count({ where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
      this.prisma.user.count({ where: { lastActiveAt: { gte: weekAgo } } }),
      this.prisma.user.count({ where: { lastActiveAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
      this.prisma.user.count({ where: { lastActiveAt: { gte: weekAgo } } }),
      this.prisma.user.count({ where: { lastActiveAt: { gte: monthAgo } } }),
      this.prisma.user.count({ where: { plan: 'premium' } }),
      this.prisma.subscriptionPeriod.findMany({
        where: { startedAt: { lte: weekAgo }, OR: [{ endedAt: null }, { endedAt: { gt: weekAgo } }] },
        select: { userId: true },
      }),
      this.prisma.subscriptionPeriod.findMany({ select: { startedAt: true, endedAt: true } }),
      this.prisma.subscriptionPeriod.findMany({
        where: { OR: [{ endedAt: null }, { endedAt: { gt: now } }] },
        select: { offer: true },
      }),
      this.prisma.application.count({ where: { responseType: 'entretien' } }),
      this.prisma.jobOutcome.findMany({
        select: { contractType: true, helpfulness: true, cancelledAt: true },
      }),
      this.prisma.profile.findMany({ select: { experienceLevel: true } }),
      this.prisma.automation.count({ where: { status: 'active' } }),
      this.prisma.offerDigest.count(),
      this.prisma.followUp.count(),
      this.prisma.subscriptionPeriod.count(),
    ]);

    const premiumWeekAgoCount = new Set(premiumWeekAgo.map((p) => p.userId)).size;

    const premiumBreakdown = { monthly: 0, pass_3_months: 0, launch: 0 } as Record<
      SubscriptionOffer,
      number
    >;
    for (const p of activePeriods) {
      premiumBreakdown[p.offer as SubscriptionOffer] += 1;
    }

    const experienceDistribution = Object.fromEntries(
      EXPERIENCE_LEVELS.map((l) => [l, 0]),
    ) as Record<ExperienceLevel, number>;
    for (const p of profiles) {
      if (p.experienceLevel) experienceDistribution[p.experienceLevel as ExperienceLevel] += 1;
    }

    return {
      headline: {
        usersTotal: { value: usersTotal, previous: usersTotalWeekAgo, trend: computeTrend(usersTotal, usersTotalWeekAgo) },
        activeThisWeek: { value: activeThisWeek, previous: activeLastWeek, trend: computeTrend(activeThisWeek, activeLastWeek) },
        newThisWeek: { value: newThisWeek, previous: newLastWeek, trend: computeTrend(newThisWeek, newLastWeek) },
        premium: { value: premiumNow, previous: premiumWeekAgoCount, trend: computeTrend(premiumNow, premiumWeekAgoCount) },
      },
      newUsersByWeek: await this.newUsersByWeek(now),
      activeUsers: { d7: activeD7, d30: activeD30 },
      premiumBreakdown,
      avgSubscriptionDays: averageSubscriptionDurationDays(periods, now),
      interviews,
      jobOutcomes: summarizeJobOutcomes(outcomes),
      experienceDistribution,
      usage: { activeAutomations, offerMailsSent, followUpsSent },
      hasSubscriptions: subscriptionCount > 0,
    };
  }

  /** 12 derniers buckets de 7 jours : nouveaux inscrits par semaine. */
  private async newUsersByWeek(now: Date): Promise<{ week: string; count: number }[]> {
    const buckets: { week: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const end = new Date(now.getTime() - i * 7 * DAY_MS);
      const start = new Date(end.getTime() - 7 * DAY_MS);
      const count = await this.prisma.user.count({
        where: { createdAt: { gte: start, lt: end } },
      });
      buckets.push({ week: start.toISOString().slice(0, 10), count });
    }
    return buckets;
  }

  // ─────────────────────────── Utilisateurs ───────────────────────────

  async listUsers(search: string, skip: number, take: number): Promise<AdminUserList> {
    const where = search ? { email: { contains: search, mode: 'insensitive' as const } } : {};
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          email: true,
          createdAt: true,
          plan: true,
          premiumUntil: true,
          disabledAt: true,
          _count: { select: { applications: true, automations: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      total,
      users: rows.map((u) => ({
        id: u.id,
        email: u.email,
        createdAt: u.createdAt.toISOString(),
        plan: u.plan,
        premiumUntil: u.premiumUntil ? u.premiumUntil.toISOString() : null,
        disabled: u.disabledAt !== null,
        applicationCount: u._count.applications,
        automationCount: u._count.automations,
      })),
    };
  }

  async setPlan(userId: string, plan: Plan): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { plan } });
  }

  async setDisabled(userId: string, disabled: boolean): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { disabledAt: disabled ? new Date() : null },
    });
  }
}
