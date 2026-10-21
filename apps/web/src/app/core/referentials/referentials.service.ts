import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { Commune, RomeJob } from '@jobzz/shared';

const API = '/api/referentials';

/**
 * Autocomplétion des référentiels (communes, métiers ROME). Un petit cache par requête évite
 * de rappeler l'API pour une saisie déjà vue.
 */
@Injectable({ providedIn: 'root' })
export class ReferentialsService {
  private readonly http = inject(HttpClient);
  private readonly communeCache = new Map<string, Commune[]>();
  private readonly metierCache = new Map<string, RomeJob[]>();

  async searchCommunes(query: string): Promise<Commune[]> {
    const q = query.trim();
    if (q.length < 2) return [];
    const key = q.toLowerCase();
    const cached = this.communeCache.get(key);
    if (cached) return cached;
    const result = await firstValueFrom(
      this.http.get<Commune[]>(`${API}/communes`, { params: { q } }),
    );
    this.communeCache.set(key, result);
    return result;
  }

  async searchMetiers(query: string): Promise<RomeJob[]> {
    const q = query.trim();
    if (q.length < 2) return [];
    const key = q.toLowerCase();
    const cached = this.metierCache.get(key);
    if (cached) return cached;
    const result = await firstValueFrom(
      this.http.get<RomeJob[]>(`${API}/metiers`, { params: { q } }),
    );
    this.metierCache.set(key, result);
    return result;
  }
}
