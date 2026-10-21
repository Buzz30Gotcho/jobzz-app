import { Injectable, Logger } from '@nestjs/common';
import type { ContractType, NormalizedOffer } from '@jobzz/shared';
import { AppConfigService } from '../config/app-config.service';
import type { JobSource, SourceQuery, SourceResult } from './job-source';

/**
 * Connecteur **France Travail – Offres d'emploi v2** (CLAUDE.md §4.4). Les noms de paramètres et
 * d'URL sont **à vérifier** dans la doc officielle et **isolés ici** (notés dans docs/DECISIONS.md).
 * Sans clés (défaut local) ou en mode démo : désactivé. Toute panne → exécution partielle (aucune
 * offre inventée).
 */
@Injectable()
export class FranceTravailSource implements JobSource {
  readonly name = 'franceTravail';
  private readonly logger = new Logger(FranceTravailSource.name);

  // À VÉRIFIER (doc France Travail).
  private readonly tokenUrl =
    'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire';
  private readonly searchUrl = 'https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search';
  private readonly scope = 'api_offresdemploiv2 o2dsoffre';
  private token: { value: string; expiresAt: number } | null = null;

  constructor(private readonly config: AppConfigService) {}

  isEnabled(): boolean {
    return (
      this.config.get('JOB_SOURCES_MODE') === 'live' &&
      this.config.get('FRANCE_TRAVAIL_CLIENT_ID').length > 0 &&
      this.config.get('FRANCE_TRAVAIL_CLIENT_SECRET').length > 0
    );
  }

  async search(query: SourceQuery): Promise<SourceResult> {
    try {
      const token = await this.accessToken();
      const params = new URLSearchParams();
      if (query.romeCodes?.length) params.set('codeROME', query.romeCodes.join(','));
      if (query.motsCles) params.set('motsCles', query.motsCles);
      if (query.communeCode) params.set('commune', query.communeCode);
      if (query.distanceKm) params.set('distance', String(query.distanceKm));
      if (query.publishedSinceDays) params.set('publieeDepuis', String(Math.min(31, query.publishedSinceDays)));
      params.set('range', '0-49');

      const res = await fetch(`${this.searchUrl}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (res.status === 204) return { offers: [] };
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { resultats?: unknown };
      return { offers: mapFranceTravailOffers(body.resultats) };
    } catch (err) {
      this.logger.warn(`France Travail indisponible : ${(err as Error).message}`);
      return { offers: [], error: "France Travail ne répond pas pour le moment, on réessaie automatiquement." };
    }
  }

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 30_000) return this.token.value;
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.get('FRANCE_TRAVAIL_CLIENT_ID'),
      client_secret: this.config.get('FRANCE_TRAVAIL_CLIENT_SECRET'),
      scope: this.scope,
    });
    const res = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) throw new Error(`token HTTP ${res.status}`);
    const json = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!json.access_token) throw new Error('token absent');
    this.token = { value: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 1200) * 1000 };
    return this.token.value;
  }
}

/** Mappe la nature/type de contrat France Travail vers notre type. */
function mapContractType(raw: { typeContrat?: string; alternance?: boolean }): ContractType | null {
  if (raw.alternance) return 'alternance';
  switch ((raw.typeContrat ?? '').toUpperCase()) {
    case 'CDI':
      return 'cdi';
    case 'CDD':
      return 'cdd';
    default:
      return null;
  }
}

/** Normalise la réponse France Travail vers `NormalizedOffer[]`. Fonction pure (testée). */
export function mapFranceTravailOffers(raw: unknown): NormalizedOffer[] {
  if (!Array.isArray(raw)) return [];
  const offers: NormalizedOffer[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const o = item as Record<string, any>;
    if (typeof o.id !== 'string' || typeof o.intitule !== 'string') continue;
    const lieu = o.lieuTravail ?? {};
    offers.push({
      source: 'franceTravail',
      externalId: o.id,
      url: o.origineOffre?.urlOrigine ?? `https://candidat.francetravail.fr/offres/recherche/detail/${o.id}`,
      title: o.intitule,
      companyName: o.entreprise?.nom ?? null,
      siret: null,
      locationLabel: lieu.libelle ?? null,
      communeCode: lieu.commune ?? null,
      lat: typeof lieu.latitude === 'number' ? lieu.latitude : null,
      lng: typeof lieu.longitude === 'number' ? lieu.longitude : null,
      contractType: mapContractType(o),
      contractNature: o.natureContrat ?? null,
      remote: null,
      startDate: null,
      startFlexible: null,
      durationMonths: null,
      experienceRequired: o.experienceExige ?? null,
      salaryText: o.salaire?.libelle ?? null,
      skills: Array.isArray(o.competences)
        ? o.competences.map((c: any) => c?.libelle).filter((s: unknown): s is string => typeof s === 'string')
        : [],
      romeCodes: typeof o.romeCode === 'string' ? [o.romeCode] : [],
      description: typeof o.description === 'string' ? o.description : '',
      publishedAt: o.dateCreation ?? null,
      sourceUpdatedAt: o.dateActualisation ?? null,
      isDemo: false,
    });
  }
  return offers;
}
