import { Injectable } from '@nestjs/common';
import type { NormalizedOffer } from '@jobzz/shared';
import { AppConfigService } from '../config/app-config.service';
import { buildDemoOffers } from './demo-offers';
import type { JobSource, SourceQuery, SourceResult } from './job-source';

/**
 * Connecteur de démonstration : uniquement actif quand `JOB_SOURCES_MODE=demo`. Offres fictives,
 * jamais utilisé comme secours en mode normal (CLAUDE.md §4.4).
 */
@Injectable()
export class DemoSource implements JobSource {
  readonly name = 'demo';
  private cache: NormalizedOffer[] | null = null;

  constructor(private readonly config: AppConfigService) {}

  isEnabled(): boolean {
    return this.config.get('JOB_SOURCES_MODE') === 'demo';
  }

  search(query: SourceQuery): Promise<SourceResult> {
    const all = (this.cache ??= buildDemoOffers());
    // Pré-filtrage léger par métier/mots-clés ; le filtrage obligatoire complet est fait ensuite.
    const rome = query.romeCodes ?? [];
    const mots = (query.motsCles ?? '').toLowerCase();
    const offers = all.filter((o) => {
      const romeOk = rome.length === 0 || o.romeCodes.some((c) => rome.includes(c));
      const motsOk = !mots || `${o.title} ${o.description}`.toLowerCase().includes(mots);
      return romeOk || motsOk;
    });
    return Promise.resolve({ offers: offers.length > 0 ? offers : all });
  }
}
