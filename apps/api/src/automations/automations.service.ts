import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Automation, Prisma } from '@prisma/client';
import {
  AUTOMATIONS,
  JUNIOR_EXCLUDE_WORDS,
  automationCriteriaSchema,
  generateAlertHelpers,
  summarizeAutomationCriteria,
  type AlertSpec,
  type AlertSuggestion,
  type AutomationCriteria,
  type AutomationInput,
  type AutomationPreview,
  type PublicAutomation,
} from '@jobzz/shared';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService, type EntitlementSubject } from '../entitlements/entitlements.service';
import { ProfileService } from '../profile/profile.service';
import { SourcesService } from '../sources/sources.service';
import type { SourceQuery } from '../sources/job-source';
import { PREVIEW_EXAMPLES, previsionParSemaine, runAutomation } from './automation-engine';

@Injectable()
export class AutomationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    private readonly profiles: ProfileService,
    private readonly sources: SourcesService,
  ) {}

  async list(userId: string): Promise<PublicAutomation[]> {
    const rows = await this.prisma.automation.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
    return rows.map(toPublicAutomation);
  }

  async get(userId: string, id: string): Promise<PublicAutomation> {
    return toPublicAutomation(await this.requireOwned(userId, id));
  }

  async create(subject: EntitlementSubject, input: AutomationInput): Promise<PublicAutomation> {
    await this.assertCanHaveAnotherActive(subject);
    const criteria = automationCriteriaSchema.parse(input.criteria);
    const row = await this.prisma.automation.create({
      data: {
        userId: subject.id,
        name: input.name,
        requestText: input.requestText ?? null,
        criteria: criteria as unknown as Prisma.InputJsonValue,
        status: 'active',
      },
    });
    return toPublicAutomation(row);
  }

  async update(userId: string, id: string, input: AutomationInput): Promise<PublicAutomation> {
    await this.requireOwned(userId, id);
    const criteria = automationCriteriaSchema.parse(input.criteria);
    const row = await this.prisma.automation.update({
      where: { id },
      data: {
        name: input.name,
        requestText: input.requestText ?? null,
        criteria: criteria as unknown as Prisma.InputJsonValue,
      },
    });
    return toPublicAutomation(row);
  }

  async setStatus(subject: EntitlementSubject, id: string, status: 'active' | 'en_pause'): Promise<PublicAutomation> {
    await this.requireOwned(subject.id, id);
    if (status === 'active') await this.assertCanHaveAnotherActive(subject);
    const row = await this.prisma.automation.update({ where: { id }, data: { status } });
    return toPublicAutomation(row);
  }

  async duplicate(subject: EntitlementSubject, id: string): Promise<PublicAutomation> {
    const source = await this.requireOwned(subject.id, id);
    await this.assertCanHaveAnotherActive(subject);
    const row = await this.prisma.automation.create({
      data: {
        userId: subject.id,
        name: `${source.name} (copie)`,
        requestText: source.requestText,
        criteria: source.criteria as Prisma.InputJsonValue,
        status: 'active',
      },
    });
    return toPublicAutomation(row);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.requireOwned(userId, id);
    await this.prisma.automation.delete({ where: { id } });
  }

  /** Aperçu : exécute l'automatisation « à blanc » sur les offres récentes (CLAUDE.md §4.6). */
  async preview(criteria: AutomationCriteria): Promise<AutomationPreview> {
    const parsed = automationCriteriaSchema.parse(criteria);
    const { offers, errors } = await this.sources.search(this.toSourceQuery(parsed, AUTOMATIONS.defaultFreshnessDays));
    const recent = offers.filter(
      (o) => !o.publishedAt || Date.now() - Date.parse(o.publishedAt) <= AUTOMATIONS.defaultFreshnessDays * 864e5,
    );
    const { kept, funnel } = runAutomation(recent, parsed);
    return {
      previsionParSemaine: previsionParSemaine(kept.length),
      funnel,
      examples: kept.slice(0, PREVIEW_EXAMPLES).map((m) => ({
        title: m.offer.title,
        companyName: m.offer.companyName,
        locationLabel: m.offer.locationLabel,
        contractType: m.offer.contractType,
        score: m.score.score,
      })),
      notice: errors[0] ?? null,
    };
  }

  /** Aide aux alertes sur les autres sites, à partir d'une automatisation ou du profil. */
  async alertHelpers(userId: string, automationId?: string): Promise<AlertSuggestion[]> {
    let spec: AlertSpec;
    if (automationId) {
      const row = await this.requireOwned(userId, automationId);
      spec = this.criteriaToAlertSpec(row.criteria as unknown as AutomationCriteria);
    } else {
      spec = await this.profileToAlertSpec(userId);
    }
    return generateAlertHelpers(spec);
  }

  // --- interne ---

  private async assertCanHaveAnotherActive(subject: EntitlementSubject): Promise<void> {
    const limit = this.entitlements.limit('active_automations', subject).limit;
    if (limit === null) return; // illimité (Premium ou PLAN_ENFORCEMENT=false)
    const active = await this.prisma.automation.count({ where: { userId: subject.id, status: 'active' } });
    if (active >= limit) {
      throw new ForbiddenException(
        `Tu as atteint la limite de ${limit} automatisation(s) active(s). Passe Premium pour en avoir plus.`,
      );
    }
  }

  private async requireOwned(userId: string, id: string): Promise<Automation> {
    const row = await this.prisma.automation.findFirst({ where: { id, userId } });
    if (!row) throw new NotFoundException('Automatisation introuvable.');
    return row;
  }

  private toSourceQuery(c: AutomationCriteria, freshnessDays: number): SourceQuery {
    const firstLocation = c.lieux[0];
    return {
      romeCodes: c.metiers.flatMap((m) => m.romeCodes),
      motsCles: c.metiers[0]?.label,
      communeCode: firstLocation?.communeCode ?? undefined,
      lat: firstLocation?.lat ?? undefined,
      lng: firstLocation?.lng ?? undefined,
      distanceKm: firstLocation?.radiusKm,
      contractTypes: c.contrats,
      publishedSinceDays: freshnessDays,
    };
  }

  private criteriaToAlertSpec(c: AutomationCriteria): AlertSpec {
    return {
      metiers: c.metiers.map((m) => m.label),
      contractWord: c.contrats[0] ? CONTRACT_WORDS[c.contrats[0]] : undefined,
      excludeWords: [...JUNIOR_EXCLUDE_WORDS, ...c.motsCles.exclure],
      locationLabel: c.lieux[0]?.label,
      radiusKm: c.lieux[0]?.radiusKm,
    };
  }

  private async profileToAlertSpec(userId: string): Promise<AlertSpec> {
    const p = await this.profiles.get(userId);
    return {
      metiers: p.jobTargets.map((j) => j.label),
      contractWord: p.contractTypes[0] ? CONTRACT_WORDS[p.contractTypes[0]] : undefined,
      excludeWords: JUNIOR_EXCLUDE_WORDS,
      locationLabel: p.locations[0]?.label,
      radiusKm: p.locations[0]?.radiusKm,
    };
  }
}

const CONTRACT_WORDS: Record<string, string> = {
  alternance: 'alternance',
  stage: 'stage',
  cdd: 'CDD',
  cdi: 'CDI',
};

function toPublicAutomation(row: Automation): PublicAutomation {
  // Robuste aux critères d'un ancien format (seed) : on revalide en appliquant les défauts.
  const parsed = automationCriteriaSchema.safeParse(row.criteria);
  const criteria = parsed.success ? parsed.data : automationCriteriaSchema.parse({});
  return {
    id: row.id,
    name: row.name,
    requestText: row.requestText,
    criteria,
    status: row.status,
    summary: summarizeAutomationCriteria(criteria),
    lastRunAt: row.lastRunAt ? row.lastRunAt.toISOString() : null,
    sentLast28Days: 0, // branché à l'exécution (passe 2)
    createdAt: row.createdAt.toISOString(),
  };
}
