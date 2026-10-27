import { Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
  TICKET_TYPE_LABELS,
  type PublicTicket,
  type TicketStatus,
} from '@jobzz/shared';
import { AdminApiService } from '../../core/admin/admin.service';
import { errorMessage } from '../auth/error-message';

/** Détail d'un ticket côté admin : fil, réponse (mail à l'utilisateur), statut. */
@Component({
  selector: 'jz-admin-ticket-detail',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  template: `
    <a routerLink="/admin/tickets" class="text-sm text-text-muted hover:text-text">← Tous les tickets</a>

    @if (ticket(); as t) {
      <div class="jz-card mt-3">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="font-mono text-xs text-text-muted">{{ typeLabels[t.type] }}</p>
            <h1 class="mt-1 text-xl font-semibold">{{ t.subject }}</h1>
          </div>
          <div class="flex gap-1">
            @for (s of statuses; track s) {
              <button
                type="button"
                [class]="statusBtn(t.status === s)"
                [disabled]="busy()"
                (click)="setStatus(s)"
              >
                {{ statusLabels[s] }}
              </button>
            }
          </div>
        </div>

        <div class="mt-5 space-y-3">
          @for (m of t.messages; track m.id) {
            <div class="rounded-card border border-border p-3" [class.bg-surface-raised]="m.fromAdmin">
              <p class="mb-1 font-mono text-[11px] text-text-muted">{{ m.fromAdmin ? 'Équipe' : 'Utilisateur' }} · {{ date(m.createdAt) }}</p>
              <p class="whitespace-pre-line text-sm">{{ m.body }}</p>
              @if (m.hasAttachment) {
                <a [href]="attachmentUrl(m.id)" target="_blank" class="mt-2 inline-block text-xs underline">Voir la pièce jointe</a>
              }
            </div>
          }
        </div>

        <form [formGroup]="form" (ngSubmit)="reply()" class="mt-5 space-y-3 border-t border-border pt-4">
          <textarea class="jz-input min-h-24" formControlName="body" maxlength="5000" placeholder="Réponse à l'utilisateur…"></textarea>
          @if (error()) {
            <p class="text-sm text-danger">{{ error() }}</p>
          }
          <button type="submit" class="jz-btn-primary" [disabled]="form.invalid || busy()">
            {{ busy() ? 'Envoi…' : 'Répondre' }}
          </button>
        </form>
      </div>
    } @else {
      <p class="mt-6 text-text-secondary">Chargement…</p>
    }
  `,
})
export class AdminTicketDetailComponent {
  private readonly api = inject(AdminApiService);
  private readonly fb = inject(FormBuilder);

  /** Id du ticket, injecté depuis la route (withComponentInputBinding). */
  readonly id = input.required<string>();

  readonly statuses = TICKET_STATUSES;
  readonly statusLabels = TICKET_STATUS_LABELS;
  readonly typeLabels = TICKET_TYPE_LABELS;

  readonly ticket = signal<PublicTicket | null>(null);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    body: ['', [Validators.required, Validators.minLength(1)]],
  });

  constructor() {
    void this.load();
  }

  date(iso: string): string {
    return new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  attachmentUrl(messageId: string): string {
    return this.api.attachmentUrl(messageId);
  }

  statusBtn(active: boolean): string {
    return active
      ? 'rounded-field bg-accent px-2.5 py-1 text-xs font-medium text-accent-ink'
      : 'rounded-field border border-border px-2.5 py-1 text-xs text-text-secondary hover:text-text';
  }

  async setStatus(status: TicketStatus): Promise<void> {
    this.busy.set(true);
    try {
      this.ticket.set(await this.api.setStatus(this.id(), status));
    } finally {
      this.busy.set(false);
    }
  }

  async reply(): Promise<void> {
    if (this.form.invalid) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      this.ticket.set(await this.api.reply(this.id(), this.form.getRawValue().body));
      this.form.reset({ body: '' });
    } catch (err) {
      this.error.set(errorMessage(err, "Impossible d'envoyer la réponse."));
    } finally {
      this.busy.set(false);
    }
  }

  private async load(): Promise<void> {
    this.ticket.set(await this.api.ticket(this.id()));
  }
}
