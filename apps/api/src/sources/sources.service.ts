import { Injectable } from '@nestjs/common';
import type { NormalizedOffer } from '@jobzz/shared';
import { DemoSource } from './demo.source';
import { FranceTravailSource } from './france-travail.source';
import { LaBonneAlternanceSource } from './la-bonne-alternance.source';
import { AdzunaSource } from './adzuna.source';
import { dedupeOffers } from './dedup';
import type { JobSource, SourceQuery } from './job-source';

export interface AggregatedResult {
  offers: NormalizedOffer[];
  /** Messages des sources en panne (affichés honnêtement, jamais d'offres inventées). */
  errors: string[];
}

/** Agrège les connecteurs actifs, mutualise les résultats et dédoublonne (CLAUDE.md §4.4). */
@Injectable()
export class SourcesService {
  private readonly sources: JobSource[];

  constructor(
    demo: DemoSource,
    franceTravail: FranceTravailSource,
    lba: LaBonneAlternanceSource,
    adzuna: AdzunaSource,
  ) {
    this.sources = [demo, franceTravail, lba, adzuna];
  }

  activeSourceNames(): string[] {
    return this.sources.filter((s) => s.isEnabled()).map((s) => s.name);
  }

  async search(query: SourceQuery): Promise<AggregatedResult> {
    const active = this.sources.filter((s) => s.isEnabled());
    const results = await Promise.all(active.map((s) => s.search(query)));

    const offers = results.flatMap((r) => r.offers);
    const errors = results.map((r) => r.error).filter((e): e is string => !!e);
    return { offers: dedupeOffers(offers), errors };
  }
}
