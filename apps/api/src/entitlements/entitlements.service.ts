import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  canConsume,
  resolveLimit,
  type EntitlementLimit,
  type Feature,
  type Plan,
  type Role,
  type UsagePeriod,
} from '@jobzz/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/app-config.service';
import { startOfPeriodParis } from '../common/time';

export interface EntitlementSubject {
  id: string;
  plan: Plan;
  role: Role;
}

/**
 * Droits (entitlements) : point d'entrée unique côté serveur pour `can`, `limit` et `consume`.
 * Toutes les fonctionnalités limitées du cahier des charges passent par ici (CLAUDE.md §2).
 * S'appuie sur le cœur pur de `@jobzz/shared` et sur `UsageCounter` pour le comptage par période.
 */
@Injectable()
export class EntitlementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  private resolve(feature: Feature, subject: EntitlementSubject): EntitlementLimit {
    return resolveLimit(feature, {
      plan: subject.plan,
      role: subject.role,
      planEnforcement: this.config.planEnforcement,
    });
  }

  /** Limite brute d'une fonctionnalité pour cet utilisateur. */
  limit(feature: Feature, subject: EntitlementSubject): EntitlementLimit {
    return this.resolve(feature, subject);
  }

  /** L'utilisateur peut-il utiliser la fonctionnalité maintenant ? (compteur de période inclus) */
  async can(
    feature: Feature,
    subject: EntitlementSubject,
  ): Promise<{ allowed: boolean; remaining: number | null; limit: number | null }> {
    const resolved = this.resolve(feature, subject);
    if (resolved.limit === null) {
      return { allowed: resolved.allowed, remaining: null, limit: null };
    }
    const count = await this.currentCount(feature, subject.id, resolved.period);
    const { allowed, remaining } = canConsume(resolved, count);
    return { allowed, remaining, limit: resolved.limit };
  }

  /**
   * Consomme une unité. Lève `ForbiddenException` si la limite est atteinte.
   * Incrémente `UsageCounter` de façon atomique (upsert + increment).
   */
  async consume(feature: Feature, subject: EntitlementSubject): Promise<void> {
    const resolved = this.resolve(feature, subject);
    if (!resolved.allowed) {
      throw new ForbiddenException(`Fonctionnalité « ${feature} » non disponible dans ton offre.`);
    }
    if (resolved.limit === null) {
      return; // illimité : rien à compter
    }
    const periodStart = startOfPeriodParis(resolved.period, new Date());
    const counter = await this.prisma.usageCounter.upsert({
      where: { userId_feature_periodStart: { userId: subject.id, feature, periodStart } },
      create: { userId: subject.id, feature, periodStart, count: 1 },
      update: { count: { increment: 1 } },
    });
    if (counter.count > resolved.limit) {
      // Dépassement : on annule l'incrément et on refuse.
      await this.prisma.usageCounter.update({
        where: { userId_feature_periodStart: { userId: subject.id, feature, periodStart } },
        data: { count: { decrement: 1 } },
      });
      throw new ForbiddenException(`Limite atteinte pour « ${feature} ».`);
    }
  }

  private async currentCount(
    feature: Feature,
    userId: string,
    period: UsagePeriod,
  ): Promise<number> {
    const periodStart = startOfPeriodParis(period, new Date());
    const counter = await this.prisma.usageCounter.findUnique({
      where: { userId_feature_periodStart: { userId, feature, periodStart } },
    });
    return counter?.count ?? 0;
  }
}
