import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
  TICKET_TYPE_LABELS,
  type AdminTicketSummary,
  type TicketStatus,
} from '@jobzz/shared';
import { AdminApiService } from '../../core/admin/admin.service';

/** Liste des tickets côté admin (CLAUDE.md §4.11), filtrable par statut. */
@Component({
  selector: 'jz-admin-tickets',
  standalone: true,
  imports: [RouterLink],
  template: `
    <h1 class="text-2xl font-semibold">Tickets</h1>

    <div class="mt-4 flex flex-wrap gap-2">
      <button type="button" [class]="pill(filter() === '')" (click)="setFilter('')">Tous</button>
      @for (s of statuses; track s) {
        <button type="button" [class]="pill(filter() === s)" (click)="setFilter(s)">
          {{ statusLabels[s] }}
        </button>
      }
    </div>

    <div class="jz-card mt-4 !p-0 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="border-b border-border text-left text-text-secondary">
          <tr>
            <th class="px-4 py-3 font-medium">Sujet</th>
            <th class="px-4 py-3 font-medium">Type</th>
            <th class="px-4 py-3 font-medium">Auteur</th>
            <th class="px-4 py-3 font-medium">Statut</th>
            <th class="px-4 py-3 text-right font-medium">Msg</th>
          </tr>
        </thead>
        <tbody>
          @for (t of tickets(); track t.id; let even = $even) {
            <tr class="cursor-pointer border-b border-border/60 hover:bg-surface" [class.bg-surface-raised]="even" [routerLink]="['/admin/tickets', t.id]">
              <td class="px-4 py-3 font-medium">{{ t.subject }}</td>
              <td class="px-4 py-3 font-mono text-xs">{{ typeLabels[t.type] }}</td>
              <td class="px-4 py-3 font-mono text-xs text-text-secondary">{{ t.userEmail }}</td>
              <td class="px-4 py-3 font-mono text-xs">{{ statusLabels[t.status] }}</td>
              <td class="px-4 py-3 text-right font-mono">{{ t.messageCount }}</td>
            </tr>
          } @empty {
            <tr><td colspan="5" class="px-4 py-6 text-center text-text-secondary">Aucun ticket.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class AdminTicketsComponent {
  private readonly api = inject(AdminApiService);

  readonly statuses = TICKET_STATUSES;
  readonly statusLabels = TICKET_STATUS_LABELS;
  readonly typeLabels = TICKET_TYPE_LABELS;

  readonly tickets = signal<AdminTicketSummary[]>([]);
  readonly filter = signal<'' | TicketStatus>('');

  constructor() {
    void this.load();
  }

  setFilter(value: '' | TicketStatus): void {
    this.filter.set(value);
    void this.load();
  }

  pill(active: boolean): string {
    return active
      ? 'rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-ink'
      : 'rounded-full border border-border px-3 py-1 text-sm text-text-secondary hover:text-text';
  }

  private async load(): Promise<void> {
    this.tickets.set(await this.api.tickets(this.filter(), ''));
  }
}
