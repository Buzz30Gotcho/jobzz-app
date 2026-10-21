import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { SearchResult } from '@jobzz/shared';

const API = '/api/offers';

export interface OfferSearchFilters {
  motsCles?: string;
  distance?: number;
  contractType?: string;
}

/** Recherche manuelle d'offres (CLAUDE.md §4.5). */
@Injectable({ providedIn: 'root' })
export class OffersService {
  private readonly http = inject(HttpClient);

  search(input: OfferSearchFilters): Promise<SearchResult> {
    const params: Record<string, string> = {};
    if (input.motsCles) params['motsCles'] = input.motsCles;
    if (input.distance != null) params['distance'] = String(input.distance);
    if (input.contractType) params['contractType'] = input.contractType;
    return firstValueFrom(this.http.get<SearchResult>(`${API}/search`, { params }));
  }

  applied(id: string, contactEmail?: string): Promise<{ duplicate: boolean }> {
    return firstValueFrom(
      this.http.post<{ duplicate: boolean }>(`${API}/${id}/applied`, contactEmail ? { contactEmail } : {}),
    );
  }

  hide(id: string): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${API}/${id}/hide`, {}));
  }
}
