import { Injectable, Logger } from '@nestjs/common';
import { CACHE, type Commune } from '@jobzz/shared';
import { TtlCache } from './ttl-cache';

/** Forme (partielle) d'une commune renvoyée par geo.api.gouv.fr. */
interface RawCommune {
  nom?: string;
  code?: string;
  codesPostaux?: string[];
  centre?: { type?: string; coordinates?: [number, number] };
  departement?: { code?: string; nom?: string };
}

const GEO_BASE = 'https://geo.api.gouv.fr';
const DEFAULT_LIMIT = 8;
const REQUEST_TIMEOUT_MS = 4000;

/**
 * Autocomplétion des communes via **geo.api.gouv.fr** (gratuit, sans clé, CLAUDE.md §4.2).
 * Fournit le code INSEE, le département et les coordonnées. Résultats mis en cache.
 */
@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);
  private readonly cache = new TtlCache<Commune[]>(CACHE.referentialsDays * 24 * 60 * 60 * 1000);

  async searchCommunes(query: string): Promise<Commune[]> {
    const q = query.trim();
    if (q.length < 2) return [];

    const cacheKey = q.toLowerCase();
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const url = new URL(`${GEO_BASE}/communes`);
    url.searchParams.set('nom', q);
    url.searchParams.set('fields', 'nom,code,codesPostaux,centre,departement');
    url.searchParams.set('boost', 'population');
    url.searchParams.set('limit', String(DEFAULT_LIMIT));

    try {
      const raw = await this.fetchJson(url.toString());
      const communes = mapGeoCommunes(raw);
      this.cache.set(cacheKey, communes);
      return communes;
    } catch (err) {
      // Panne du référentiel : jamais bloquant, l'utilisateur peut saisir une ville libre.
      this.logger.warn(`Communes indisponibles (${(err as Error).message})`);
      return [];
    }
  }

  private async fetchJson(url: string): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } finally {
      clearTimeout(timer);
    }
  }
}

/** Normalise la réponse geo.api.gouv.fr vers `Commune[]`. Fonction pure (testée). */
export function mapGeoCommunes(raw: unknown): Commune[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((c): c is RawCommune => typeof c === 'object' && c !== null)
    .filter((c) => typeof c.code === 'string' && typeof c.nom === 'string')
    .map((c) => {
      const coords = c.centre?.coordinates;
      return {
        code: c.code as string,
        label: c.nom as string,
        postalCode: c.codesPostaux?.[0] ?? null,
        departement: c.departement?.code ?? null,
        lng: Array.isArray(coords) ? coords[0] : null,
        lat: Array.isArray(coords) ? coords[1] : null,
      } satisfies Commune;
    });
}
