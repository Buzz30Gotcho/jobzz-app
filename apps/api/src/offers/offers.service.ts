import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { Offer } from '@prisma/client';
import {
  SEARCH,
  applyDailyViewLimit,
  computeOfferScore,
  distanceKm,
  passesJuniorFilter,
  skillMatchScore,
  type ContractType,
  type ExperienceLevel,
  type NormalizedOffer,
  type PublicOffer,
  type PublicProfile,
  type ScoringProfile,
  type SearchOffersInput,
  type SearchResult,
} from '@jobzz/shared';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeKey } from '../common/normalize';
import { startOfDayParis } from '../common/time';
import { EntitlementsService, type EntitlementSubject } from '../entitlements/entitlements.service';
import { ProfileService } from '../profile/profile.service';
import { ApplicationsService } from '../applications/applications.service';
import { SourcesService } from '../sources/sources.service';
import type { SourceQuery } from '../sources/job-source';

const MAX_RESULTS = 50;

@Injectable()
export class OffersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sources: SourcesService,
    private readonly entitlements: EntitlementsService,
    private readonly profiles: ProfileService,
    private readonly applications: ApplicationsService,
  ) {}

  /** Recherche manuelle (CLAUDE.md §4.5) : filtres obligatoires → score → tri → limite du jour. */
  async search(subject: EntitlementSubject, input: SearchOffersInput): Promise<SearchResult> {
    const profile = await this.profiles.get(subject.id);
    const scoring = toScoringProfile(profile);
    const query = this.buildQuery(profile, input);

    // Trace la première recherche (carte « Bien démarrer », §4.9) sans bloquer la réponse.
    void this.prisma.user
      .updateMany({ where: { id: subject.id, firstSearchAt: null }, data: { firstSearchAt: new Date() } })
      .catch(() => undefined);

    const { offers: normalized, errors } = await this.sources.search(query);
    const stored = await this.persistOffers(normalized);

    // Offres déjà masquées ou postulées : jamais réaffichées.
    const interactions = await this.prisma.offerInteraction.findMany({
      where: { userId: subject.id, offerId: { in: stored.map((s) => s.id) } },
      select: { offerId: true },
    });
    const excluded = new Set(interactions.map((i) => i.offerId));

    const level: ExperienceLevel = profile.experienceLevel ?? 'debutant';
    const maxAge = SEARCH.maxOfferAgeDays * 24 * 60 * 60 * 1000;
    const allowedContracts =
      (input.contractType as ContractType[] | undefined) ?? profile.contractTypes;
    // Mot-clé explicitement tapé : recherche libre, qui peut sortir du métier du profil.
    const keyword = input.motsCles?.trim() ? input.motsCles.trim().toLowerCase() : undefined;

    const scored = stored
      .filter((s) => !excluded.has(s.id))
      .filter((s) => this.passesMandatory(s.offer, scoring, level, allowedContracts, maxAge, keyword))
      // Recherche libre par mot-clé : on garde tout ce qui contient le mot (le filtre dur est déjà
      // appliqué), sans plancher de score ; sinon on applique le seuil d'affichage habituel.
      .map((s) => {
        const score = computeOfferScore(
          {
            title: s.offer.title,
            description: s.offer.description,
            skills: s.offer.skills,
            romeCodes: s.offer.romeCodes,
            contractType: s.offer.contractType,
            remote: s.offer.remote,
            lat: s.offer.lat,
            lng: s.offer.lng,
            startDate: s.offer.startDate,
            startFlexible: s.offer.startFlexible,
            durationMonths: s.offer.durationMonths,
            experienceRequired: s.offer.experienceRequired,
          },
          scoring,
        );
        return { id: s.id, offer: s.offer, score };
      })
      .filter((s) => keyword !== undefined || s.score.score >= SEARCH.minDisplayedScore)
      .sort((a, b) => b.score.score - a.score.score)
      .slice(0, MAX_RESULTS);

    // Limite des offres vues du jour (gratuit).
    const limit = this.entitlements.limit('offers_viewed', subject).limit;
    const today = startOfDayParis(new Date());
    const viewedRows = await this.prisma.offerView.findMany({
      where: { userId: subject.id, day: today },
      select: { offerId: true },
    });
    const alreadyViewed = new Set(viewedRows.map((v) => v.offerId));

    const limited = applyDailyViewLimit(scored, alreadyViewed, limit);
    if (limited.newlyViewedIds.length > 0) {
      await this.prisma.offerView.createMany({
        data: limited.newlyViewedIds.map((offerId) => ({ userId: subject.id, offerId, day: today })),
        skipDuplicates: true,
      });
    }

    return {
      offers: limited.offers.map((o) => toPublicOffer(o.offer, o.id, o.score, o.locked, scoring)),
      total: scored.length,
      viewed: limited.viewedCount,
      dailyLimit: limit,
      remainingMatches: limited.remainingMatches,
      notice: errors[0] ?? (this.sources.activeSourceNames().length === 0 ? "La recherche d'offres n'est pas encore configurée." : null),
    };
  }

  /** « J'ai postulé » : crée l'interaction et la candidature reliée aux relances. */
  async markApplied(
    subject: EntitlementSubject,
    offerId: string,
    contactEmail?: string,
  ): Promise<{ duplicate: boolean }> {
    const offer = await this.prisma.offer.findUniqueOrThrow({ where: { id: offerId } });
    await this.prisma.offerInteraction.upsert({
      where: { userId_offerId_type: { userId: subject.id, offerId, type: 'applied' } },
      create: { userId: subject.id, offerId, type: 'applied' },
      update: {},
    });
    const { duplicate } = await this.applications.createFromOffer(subject.id, {
      companyName: offer.companyName ?? 'Entreprise',
      position: offer.title,
      contactEmail,
      offerId: offer.id,
      offerUrl: offer.url,
    });
    return { duplicate };
  }

  /** « Masquer » : l'offre ne revient plus. */
  async hide(userId: string, offerId: string): Promise<void> {
    await this.prisma.offerInteraction.upsert({
      where: { userId_offerId_type: { userId, offerId, type: 'hidden' } },
      create: { userId, offerId, type: 'hidden' },
      update: {},
    });
  }

  // --- interne ---

  private buildQuery(profile: PublicProfile, input: SearchOffersInput): SourceQuery {
    const romeCodes = profile.jobTargets.flatMap((j) => j.romeCodes);
    const firstLocation = profile.locations[0];
    return {
      romeCodes,
      motsCles: input.motsCles ?? profile.jobTargets[0]?.label,
      communeCode: input.commune ?? firstLocation?.communeCode ?? undefined,
      lat: firstLocation?.lat ?? undefined,
      lng: firstLocation?.lng ?? undefined,
      distanceKm: input.distance ?? firstLocation?.radiusKm,
      contractTypes: (input.contractType as ContractType[] | undefined) ?? profile.contractTypes,
      publishedSinceDays: SEARCH.maxOfferAgeDays,
    };
  }

  private passesMandatory(
    offer: NormalizedOffer,
    scoring: ScoringProfile,
    level: ExperienceLevel,
    allowedContracts: ContractType[],
    maxAgeMs: number,
    keyword?: string,
  ): boolean {
    // Fraîcheur (< 30 jours) si la date est connue.
    if (offer.publishedAt) {
      const age = Date.now() - Date.parse(offer.publishedAt);
      if (age > maxAgeMs) return false;
    }
    // Contrat (si l'offre précise un contrat et qu'on a une préférence).
    if (allowedContracts.length > 0 && offer.contractType && !allowedContracts.includes(offer.contractType)) {
      return false;
    }
    // Filtre junior.
    if (!passesJuniorFilter({ title: offer.title, description: offer.description, experienceRequired: offer.experienceRequired }, level).kept) {
      return false;
    }
    // Recherche libre : un mot-clé tapé est un filtre dur et remplace le filtre métier/compétences
    // du profil (il peut donc sortir du métier visé). Les garde-fous ci-dessus restent appliqués.
    if (keyword) {
      return `${offer.title} ${offer.description}`.toLowerCase().includes(keyword);
    }
    // Métier : code ROME (même domaine) ou mots-clés du métier.
    if (scoring.romeCodes.length > 0) {
      const domainOk = offer.romeCodes.some((c) =>
        scoring.romeCodes.some((p) => p.slice(0, 3) === c.slice(0, 3)),
      );
      const haystack = `${offer.title} ${offer.description}`.toLowerCase();
      const keywordOk = scoring.jobLabels.some((l) => l.length > 2 && haystack.includes(l.toLowerCase()));
      if (!domainOk && !keywordOk) return false;
    }
    // Compétences : au moins une en commun, sauf si profil < 3 compétences ou offre sans compétences.
    if (scoring.skills.length >= 3 && offer.skills.length > 0) {
      const hasCommon = offer.skills.some((s) => skillMatchScore(s, scoring.skills) >= 0.5);
      if (!hasCommon) return false;
    }
    return true;
  }

  /** Upsert des offres (unicité source + externalId), renvoie l'id DB et la forme normalisée. */
  async persistOffers(
    normalized: NormalizedOffer[],
  ): Promise<{ id: string; offer: NormalizedOffer }[]> {
    const out: { id: string; offer: NormalizedOffer }[] = [];
    for (const o of normalized) {
      const contentHash = createHash('md5')
        .update(`${o.title}|${o.description}|${o.companyName ?? ''}`)
        .digest('hex');
      const data = {
        url: o.url,
        title: o.title,
        titleKey: normalizeKey(o.title),
        companyName: o.companyName,
        companyKey: o.companyName ? normalizeKey(o.companyName) : null,
        siret: o.siret,
        locationLabel: o.locationLabel,
        communeCode: o.communeCode,
        lat: o.lat,
        lng: o.lng,
        contractType: o.contractType,
        contractNature: o.contractNature,
        remote: o.remote,
        startDate: o.startDate ? new Date(o.startDate) : null,
        startFlexible: o.startFlexible,
        durationMonths: o.durationMonths,
        experienceRequired: o.experienceRequired,
        salaryText: o.salaryText,
        skills: o.skills,
        romeCodes: o.romeCodes,
        description: o.description,
        publishedAt: o.publishedAt ? new Date(o.publishedAt) : null,
        sourceUpdatedAt: o.sourceUpdatedAt ? new Date(o.sourceUpdatedAt) : null,
        contentHash,
        isDemo: o.isDemo,
      };
      const row: Offer = await this.prisma.offer.upsert({
        where: { source_externalId: { source: o.source, externalId: o.externalId } },
        create: { source: o.source, externalId: o.externalId, ...data },
        update: data,
      });
      out.push({ id: row.id, offer: o });
    }
    return out;
  }
}

function toScoringProfile(profile: PublicProfile): ScoringProfile {
  return {
    skills: profile.skills,
    romeCodes: profile.jobTargets.flatMap((j) => j.romeCodes),
    jobLabels: profile.jobTargets.map((j) => j.label),
    locations: profile.locations.map((l) => ({ lat: l.lat, lng: l.lng, radiusKm: l.radiusKm })),
    availableFrom: profile.availableFrom,
    experienceLevel: profile.experienceLevel,
    alternanceRythme: profile.alternance?.rythme ?? null,
    internshipDuration: profile.internship?.dureeMois
      ? { min: profile.internship.dureeMois, max: profile.internship.dureeMois }
      : null,
  };
}

function toPublicOffer(
  offer: NormalizedOffer,
  id: string,
  score: { score: number; label: string; explanation: string },
  locked: boolean,
  scoring: ScoringProfile,
): PublicOffer {
  const base: PublicOffer = {
    id,
    source: offer.source,
    url: offer.url,
    title: offer.title,
    companyName: offer.companyName,
    locationLabel: offer.locationLabel,
    distanceKm: nearestDistance(offer, scoring),
    contractType: offer.contractType,
    remote: offer.remote,
    startDate: offer.startDate,
    durationMonths: offer.durationMonths,
    salaryText: offer.salaryText,
    skills: offer.skills,
    description: offer.description,
    publishedAt: offer.publishedAt,
    isDemo: offer.isDemo,
    score: score.score,
    scoreLabel: score.label,
    explanation: score.explanation,
    locked,
  };
  if (!locked) return base;
  // Floutée : on ne révèle ni le titre, ni l'entreprise, ni la description (rang + score seulement).
  return {
    ...base,
    title: '',
    companyName: null,
    locationLabel: null,
    description: '',
    skills: [],
    url: '',
    explanation: '',
  };
}

function nearestDistance(offer: NormalizedOffer, scoring: ScoringProfile): number | null {
  if (offer.lat === null || offer.lng === null) return null;
  const geo = scoring.locations.filter((l) => l.lat !== null && l.lng !== null);
  if (geo.length === 0) return null;
  let min = Infinity;
  for (const l of geo) {
    min = Math.min(min, distanceKm({ lat: offer.lat, lng: offer.lng }, { lat: l.lat!, lng: l.lng! }));
  }
  return Math.round(min);
}
