import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { CvOfferComparisonResult, CvProfileExtract, CvStatus } from '@jobzz/shared';

const API = '/api/cv';

/** Accès au CV de l'utilisateur (CLAUDE.md §4.8) : état, dépôt, suppression. */
@Injectable({ providedIn: 'root' })
export class CvService {
  private readonly http = inject(HttpClient);

  status(): Promise<CvStatus> {
    return firstValueFrom(this.http.get<CvStatus>(API));
  }

  upload(file: File): Promise<CvStatus> {
    const form = new FormData();
    form.append('file', file);
    return firstValueFrom(this.http.post<CvStatus>(API, form));
  }

  remove(): Promise<void> {
    return firstValueFrom(this.http.delete<void>(API));
  }

  compare(offerId: string): Promise<CvOfferComparisonResult> {
    return firstValueFrom(this.http.post<CvOfferComparisonResult>(`${API}/compare/${offerId}`, {}));
  }

  analyzeAi(): Promise<CvStatus> {
    return firstValueFrom(this.http.post<CvStatus>(`${API}/analyze-ai`, {}));
  }

  extractProfile(): Promise<CvProfileExtract> {
    return firstValueFrom(this.http.post<CvProfileExtract>(`${API}/extract-profile`, {}));
  }

  compareAi(offerId: string): Promise<CvOfferComparisonResult> {
    return firstValueFrom(
      this.http.post<CvOfferComparisonResult>(`${API}/compare/${offerId}/ai`, {}),
    );
  }
}
