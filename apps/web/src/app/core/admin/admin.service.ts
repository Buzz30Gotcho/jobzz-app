import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type {
  AdminHealth,
  AdminStats,
  AdminTicketSummary,
  AdminUserList,
  Plan,
  PublicTicket,
  TicketStatus,
} from '@jobzz/shared';

const API = '/api/admin';

/** Accès aux données de l'espace admin (CLAUDE.md §4.11). */
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);

  health(): Promise<AdminHealth> {
    return firstValueFrom(this.http.get<AdminHealth>(`${API}/health`));
  }

  runAutomations(): Promise<{ started: boolean }> {
    return firstValueFrom(this.http.post<{ started: boolean }>(`${API}/automations/run`, {}));
  }

  stats(): Promise<AdminStats> {
    return firstValueFrom(this.http.get<AdminStats>(`${API}/stats`));
  }

  users(search: string, skip: number, take: number): Promise<AdminUserList> {
    const params = { search, skip: String(skip), take: String(take) };
    return firstValueFrom(this.http.get<AdminUserList>(`${API}/users`, { params }));
  }

  setPlan(userId: string, plan: Plan): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${API}/users/${userId}/plan`, { plan }));
  }

  setDisabled(userId: string, disabled: boolean): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${API}/users/${userId}/disabled`, { disabled }));
  }

  tickets(status: string, type: string): Promise<AdminTicketSummary[]> {
    const params: Record<string, string> = {};
    if (status) params['status'] = status;
    if (type) params['type'] = type;
    return firstValueFrom(this.http.get<AdminTicketSummary[]>(`${API}/tickets`, { params }));
  }

  ticket(id: string): Promise<PublicTicket> {
    return firstValueFrom(this.http.get<PublicTicket>(`${API}/tickets/${id}`));
  }

  reply(id: string, body: string): Promise<PublicTicket> {
    return firstValueFrom(this.http.post<PublicTicket>(`${API}/tickets/${id}/reply`, { body }));
  }

  setStatus(id: string, status: TicketStatus): Promise<PublicTicket> {
    return firstValueFrom(this.http.post<PublicTicket>(`${API}/tickets/${id}/status`, { status }));
  }

  attachmentUrl(messageId: string): string {
    return `/api/support/attachments/${messageId}`;
  }
}
