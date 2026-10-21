import { Injectable, Logger } from '@nestjs/common';
import type { NormalizedOffer } from '@jobzz/shared';
import { AppConfigService } from '../config/app-config.service';
import type { JobSource, SourceQuery, SourceResult } from './job-source';

/**
 * Connecteur **La bonne alternance** (alternance uniquement, CLAUDE.md §4.4). Paramètres/URL
 * **à vérifier** (doc api.apprentissage.beta.gouv.fr), isolés ici. Interdiction de revendre les
 * données. Désactivé sans clé ou en mode démo.
 */
@Injectable()
export class LaBonneAlternanceSource implements JobSource {
  readonly name = 'laBonneAlternance';
  private readonly logger = new Logger(LaBonneAlternanceSource.name);

  // À VÉRIFIER (doc officielle).
  private readonly searchUrl = 'https://api.apprentissage.beta.gouv.fr/api/job/v1/search';

  constructor(private readonly config: AppConfigService) {}

  isEnabled(): boolean {
    return this.config.get('JOB_SOURCES_MODE') === 'live' && this.config.get('LBA_API_KEY').length > 0;
  }

  async search(query: SourceQuery): Promise<SourceResult> {
    if (!query.romeCodes?.length || query.lat === undefined || query.lng === undefined) {
      // LBA exige des codes ROME et une position : sans ça, pas d'appel.
      return { offers: [] };
    }
    try {
      const params = new URLSearchParams({
        romes: query.romeCodes.join(','),
        latitude: String(query.lat),
        longitude: String(query.lng),
        radius: String(query.distanceKm ?? 30),
      });
      const res = await fetch(`${this.searchUrl}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${this.config.get('LBA_API_KEY')}`, Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { jobs?: unknown };
      return { offers: mapLbaOffers(body.jobs) };
    } catch (err) {
      this.logger.warn(`La bonne alternance indisponible : ${(err as Error).message}`);
      return { offers: [], error: 'La bonne alternance ne répond pas pour le moment.' };
    }
  }
}

/** Normalise la réponse La bonne alternance vers `NormalizedOffer[]`. Fonction pure (testée). */
export function mapLbaOffers(raw: unknown): NormalizedOffer[] {
  if (!Array.isArray(raw)) return [];
  const offers: NormalizedOffer[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const o = item as Record<string, any>;
    const id = o.identifier?.id ?? o.id;
    if (typeof id !== 'string' || typeof o.offer?.title !== 'string') continue;
    const place = o.workplace ?? {};
    const geo = place.location?.geopoint?.coordinates ?? place.geopoint?.coordinates;
    const contract = o.contract ?? {};
    const remoteRaw = (contract.remote ?? '').toString().toLowerCase();
    offers.push({
      source: 'laBonneAlternance',
      externalId: id,
      url: o.apply?.url ?? o.url ?? '',
      title: o.offer.title,
      companyName: place.name ?? null,
      siret: place.siret ?? null,
      locationLabel: place.location?.address ?? place.city ?? null,
      communeCode: null,
      lat: Array.isArray(geo) ? geo[1] : null,
      lng: Array.isArray(geo) ? geo[0] : null,
      contractType: 'alternance',
      contractNature: Array.isArray(contract.type) ? contract.type.join(', ') : contract.type ?? null,
      remote: remoteRaw.includes('remote') ? 'distance' : remoteRaw.includes('hybrid') ? 'hybride' : null,
      startDate: contract.start ?? o.offer?.target_diploma?.start ?? null,
      startFlexible: null,
      durationMonths: typeof contract.duration === 'number' ? contract.duration : null,
      experienceRequired: null,
      salaryText: null,
      skills: Array.isArray(o.offer?.rome_code) ? [] : [],
      romeCodes: Array.isArray(o.offer?.rome_code) ? o.offer.rome_code.filter((c: unknown) => typeof c === 'string') : [],
      description: typeof o.offer?.description === 'string' ? o.offer.description : '',
      publishedAt: o.offer?.publication?.creation_date ?? null,
      sourceUpdatedAt: null,
      isDemo: false,
    });
  }
  return offers;
}
