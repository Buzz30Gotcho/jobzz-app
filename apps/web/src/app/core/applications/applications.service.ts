import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type {
  ApplicationFilter,
  CreateFromOfferInput,
  DashboardSummary,
  FreeSendInput,
  GeneratedMessage,
  PublicApplication,
  RecordFollowUpInput,
  ResponseType,
} from '@jobzz/shared';

const API = '/api/applications';

/** Accès aux candidatures et relances (CLAUDE.md §4.3), avec un petit état en signals. */
@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  private readonly http = inject(HttpClient);

  /** Nombre de buzz du jour (badge de navigation). */
  readonly dueCount = signal(0);

  async list(filter: ApplicationFilter, search?: string): Promise<PublicApplication[]> {
    const params: Record<string, string> = { filter };
    if (search) params['search'] = search;
    return firstValueFrom(this.http.get<PublicApplication[]>(API, { params }));
  }

  async due(): Promise<PublicApplication[]> {
    const list = await firstValueFrom(this.http.get<PublicApplication[]>(`${API}/due`));
    this.dueCount.set(list.length);
    return list;
  }

  dashboard(): Promise<DashboardSummary> {
    return firstValueFrom(this.http.get<DashboardSummary>(`${API}/dashboard`));
  }

  createFromOffer(
    input: CreateFromOfferInput,
  ): Promise<{ application: PublicApplication; duplicate: boolean }> {
    return firstValueFrom(
      this.http.post<{ application: PublicApplication; duplicate: boolean }>(`${API}/from-offer`, input),
    );
  }

  freeSend(input: FreeSendInput): Promise<PublicApplication> {
    return firstValueFrom(this.http.post<PublicApplication>(`${API}/free-send`, input));
  }

  /** Rédige un message de relance (IA si Premium et disponible, sinon modèle). */
  aiMessage(id: string): Promise<GeneratedMessage> {
    return firstValueFrom(this.http.post<GeneratedMessage>(`${API}/${id}/ai-message`, {}));
  }

  recordFollowUp(id: string, input: RecordFollowUpInput): Promise<PublicApplication> {
    return firstValueFrom(this.http.post<PublicApplication>(`${API}/${id}/follow-ups`, input));
  }

  respond(id: string, responseType: ResponseType): Promise<PublicApplication> {
    return firstValueFrom(this.http.post<PublicApplication>(`${API}/${id}/respond`, { responseType }));
  }

  archive(id: string): Promise<PublicApplication> {
    return firstValueFrom(this.http.patch<PublicApplication>(`${API}/${id}/archive`, {}));
  }
}
