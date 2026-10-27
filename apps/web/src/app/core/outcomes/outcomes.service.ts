import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { CreateJobOutcomeInput, PublicJobOutcome } from '@jobzz/shared';

const API = '/api/outcomes';

/** « J'ai trouvé ! » (CLAUDE.md §4.9). */
@Injectable({ providedIn: 'root' })
export class OutcomesService {
  private readonly http = inject(HttpClient);

  create(input: CreateJobOutcomeInput): Promise<PublicJobOutcome> {
    return firstValueFrom(this.http.post<PublicJobOutcome>(API, input));
  }

  pauseAutomations(): Promise<{ paused: number }> {
    return firstValueFrom(this.http.post<{ paused: number }>(`${API}/pause-automations`, {}));
  }
}
