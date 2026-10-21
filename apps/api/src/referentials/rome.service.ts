import { Injectable, Logger } from '@nestjs/common';
import { CACHE, type RomeJob } from '@jobzz/shared';
import { AppConfigService } from '../config/app-config.service';
import { TtlCache } from './ttl-cache';

/**
 * Autocomplétion des métiers sur le référentiel **ROME** (API France Travail, CLAUDE.md §4.2).
 *
 * Les codes ROME ne sont **jamais inventés** : ils viennent uniquement du référentiel. Quand les
 * clés France Travail ne sont pas configurées (cas par défaut en local), la recherche renvoie
 * une liste vide et le front bascule sur la **saisie libre** (le libellé sert de mots-clés).
 *
 * Les URLs et les noms de champs de l'API sont **isolés ici** et notés « à vérifier » dans
 * `docs/DECISIONS.md` (confrontation à la doc officielle lors de l'étape 5).
 */
@Injectable()
export class RomeService {
  private readonly logger = new Logger(RomeService.name);
  private readonly cache = new TtlCache<RomeJob[]>(CACHE.referentialsDays * 24 * 60 * 60 * 1000);

  // À vERIFIER (doc France Travail) — isolés ici, utilisés seulement si les clés sont présentes.
  private readonly tokenUrl =
    'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire';
  private readonly romeScope = 'api_rome-metiersv1 nomenclatureRome';
  private readonly suggestUrl =
    'https://api.francetravail.io/partenaire/rome-metiers/v1/metiers/metier/requete';

  private token: { value: string; expiresAt: number } | null = null;

  constructor(private readonly config: AppConfigService) {}

  private get configured(): boolean {
    return (
      this.config.get('FRANCE_TRAVAIL_CLIENT_ID').length > 0 &&
      this.config.get('FRANCE_TRAVAIL_CLIENT_SECRET').length > 0
    );
  }

  async searchMetiers(query: string): Promise<RomeJob[]> {
    const q = query.trim();
    if (q.length < 2) return [];
    // Sans clés : saisie libre (aucun code ROME inventé).
    if (!this.configured) return [];

    const cacheKey = q.toLowerCase();
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const token = await this.accessToken();
      const res = await fetch(`${this.suggestUrl}?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const jobs = mapRomeJobs(await res.json());
      this.cache.set(cacheKey, jobs);
      return jobs;
    } catch (err) {
      this.logger.warn(`ROME indisponible (${(err as Error).message}) — saisie libre`);
      return [];
    }
  }

  /** Jeton OAuth2 client_credentials, mis en cache et renouvelé avant expiration. */
  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 30_000) return this.token.value;

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.get('FRANCE_TRAVAIL_CLIENT_ID'),
      client_secret: this.config.get('FRANCE_TRAVAIL_CLIENT_SECRET'),
      scope: this.romeScope,
    });
    const res = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) throw new Error(`token HTTP ${res.status}`);
    const json = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!json.access_token) throw new Error('token absent');
    this.token = {
      value: json.access_token,
      expiresAt: Date.now() + (json.expires_in ?? 1200) * 1000,
    };
    return this.token.value;
  }
}

/** Normalise la réponse ROME vers `RomeJob[]`. Fonction pure (testée). */
export function mapRomeJobs(raw: unknown): RomeJob[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const jobs: RomeJob[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const r = item as { code?: unknown; libelle?: unknown };
    const code = typeof r.code === 'string' ? r.code : null;
    const label = typeof r.libelle === 'string' ? r.libelle : null;
    if (!code || !label || seen.has(code)) continue;
    seen.add(code);
    jobs.push({ code, label });
  }
  return jobs;
}
