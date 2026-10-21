import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type {
  AlertSuggestion,
  AutomationCriteria,
  AutomationInput,
  AutomationPreview,
  PublicAutomation,
} from '@jobzz/shared';

const API = '/api/automations';

/** Automatisations (CLAUDE.md §4.6) côté front. */
@Injectable({ providedIn: 'root' })
export class AutomationsService {
  private readonly http = inject(HttpClient);

  list(): Promise<PublicAutomation[]> {
    return firstValueFrom(this.http.get<PublicAutomation[]>(API));
  }

  get(id: string): Promise<PublicAutomation> {
    return firstValueFrom(this.http.get<PublicAutomation>(`${API}/${id}`));
  }

  create(input: AutomationInput): Promise<PublicAutomation> {
    return firstValueFrom(this.http.post<PublicAutomation>(API, input));
  }

  update(id: string, input: AutomationInput): Promise<PublicAutomation> {
    return firstValueFrom(this.http.put<PublicAutomation>(`${API}/${id}`, input));
  }

  setStatus(id: string, status: 'active' | 'en_pause'): Promise<PublicAutomation> {
    return firstValueFrom(this.http.post<PublicAutomation>(`${API}/${id}/status`, { status }));
  }

  duplicate(id: string): Promise<PublicAutomation> {
    return firstValueFrom(this.http.post<PublicAutomation>(`${API}/${id}/duplicate`, {}));
  }

  remove(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${API}/${id}`));
  }

  preview(criteria: AutomationCriteria): Promise<AutomationPreview> {
    return firstValueFrom(this.http.post<AutomationPreview>(`${API}/preview`, criteria));
  }

  alertHelpers(automationId?: string): Promise<AlertSuggestion[]> {
    const params: Record<string, string> = automationId ? { automationId } : {};
    return firstValueFrom(this.http.get<AlertSuggestion[]>(`${API}/alert-helpers`, { params }));
  }

  /** Lance maintenant mes automatisations (ignore la cadence) — pour tester le mail. */
  runMine(): Promise<{ sent: boolean; reason?: string; candidates: number }> {
    return firstValueFrom(
      this.http.post<{ sent: boolean; reason?: string; candidates: number }>(`${API}/run-mine`, {}),
    );
  }
}
