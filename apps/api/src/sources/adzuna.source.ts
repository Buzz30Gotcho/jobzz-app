import { Injectable } from '@nestjs/common';
import type { JobSource, SourceResult } from './job-source';

/**
 * Connecteur Adzuna **désactivé par défaut** (CLAUDE.md §4.4) : quotas faibles et licence
 * commerciale nécessaire. Prévu mais jamais actif en v1.
 */
@Injectable()
export class AdzunaSource implements JobSource {
  readonly name = 'adzuna';
  isEnabled(): boolean {
    return false;
  }
  search(): Promise<SourceResult> {
    return Promise.resolve({ offers: [] });
  }
}
