import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type {
  CreateTicketInput,
  FaqEntry,
  PublicTicket,
  TicketSummary,
} from '@jobzz/shared';

const API = '/api/support';

/** Aide : FAQ et tickets de l'utilisateur (CLAUDE.md §4.10). */
@Injectable({ providedIn: 'root' })
export class SupportService {
  private readonly http = inject(HttpClient);

  faq(): Promise<FaqEntry[]> {
    return firstValueFrom(this.http.get<FaqEntry[]>(`${API}/faq`));
  }

  listTickets(): Promise<TicketSummary[]> {
    return firstValueFrom(this.http.get<TicketSummary[]>(`${API}/tickets`));
  }

  getTicket(id: string): Promise<PublicTicket> {
    return firstValueFrom(this.http.get<PublicTicket>(`${API}/tickets/${id}`));
  }

  createTicket(input: CreateTicketInput, screenshot: File | null): Promise<PublicTicket> {
    return firstValueFrom(this.http.post<PublicTicket>(`${API}/tickets`, this.form(input, screenshot)));
  }

  reply(id: string, body: string, screenshot: File | null): Promise<PublicTicket> {
    return firstValueFrom(
      this.http.post<PublicTicket>(`${API}/tickets/${id}/messages`, this.form({ body }, screenshot)),
    );
  }

  /** URL d'une pièce jointe (servie uniquement à l'auteur et à l'admin). */
  attachmentUrl(messageId: string): string {
    return `${API}/attachments/${messageId}`;
  }

  /** Construit un `FormData` : champs texte + éventuelle capture d'écran (`screenshot`). */
  private form(fields: Record<string, string>, screenshot: File | null): FormData {
    const data = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      data.append(key, value);
    }
    if (screenshot) data.append('screenshot', screenshot);
    return data;
  }
}
