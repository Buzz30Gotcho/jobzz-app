import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  TICKET_STATUS_LABELS,
  TICKET_TYPES,
  TICKET_TYPE_LABELS,
  type PublicTicket,
  type TicketStatus,
  type TicketSummary,
  type TicketType,
} from '@jobzz/shared';
import { SupportService } from '../../../core/support/support.service';
import { errorMessage } from '../../auth/error-message';
import { AideTabsComponent } from './aide-tabs.component';

@Component({
  selector: 'jz-demandes',
  standalone: true,
  imports: [ReactiveFormsModule, AideTabsComponent],
  template: `
    <div class="mx-auto max-w-3xl">
      <div class="flex items-center justify-between gap-4">
        <h1 class="text-2xl font-semibold">Aide</h1>
        @if (mode() === 'list') {
          <button type="button" class="jz-btn-primary" (click)="startNew()">Nouvelle demande</button>
        }
      </div>
      <jz-aide-tabs />

      <!-- Nouvelle demande -->
      @if (mode() === 'new') {
        <form [formGroup]="form" (ngSubmit)="submit()" class="jz-card mt-6 space-y-4">
          <h2 class="font-semibold">Nouvelle demande</h2>
          <div>
            <label class="jz-label">Type</label>
            <div class="flex gap-2">
              @for (t of types; track t) {
                <button
                  type="button"
                  (click)="form.controls.type.setValue(t)"
                  class="rounded-field border px-3 py-1.5 text-sm transition-colors"
                  [class.border-accent]="form.controls.type.value === t"
                  [class.text-accent]="form.controls.type.value === t"
                  [class.border-border]="form.controls.type.value !== t"
                  [class.text-text-secondary]="form.controls.type.value !== t"
                >
                  {{ typeLabels[t] }}
                </button>
              }
            </div>
          </div>
          <div>
            <label for="subject" class="jz-label">Sujet</label>
            <input id="subject" class="jz-input" formControlName="subject" maxlength="150" />
          </div>
          <div>
            <label for="message" class="jz-label">Message</label>
            <textarea id="message" class="jz-input min-h-28" formControlName="message" maxlength="5000"></textarea>
          </div>
          <div>
            <label for="shot" class="jz-label">Capture d'écran (facultatif)</label>
            <input id="shot" type="file" accept="image/png,image/jpeg,image/webp" (change)="pickFile($event)" class="text-sm text-text-secondary" />
          </div>
          @if (error()) {
            <p class="text-sm text-danger">{{ error() }}</p>
          }
          <div class="flex gap-3">
            <button type="submit" class="jz-btn-primary" [disabled]="form.invalid || busy()">
              {{ busy() ? 'Envoi…' : 'Envoyer' }}
            </button>
            <button type="button" class="jz-btn-ghost" (click)="mode.set('list')">Annuler</button>
          </div>
        </form>
      }

      <!-- Détail d'un ticket -->
      @else if (mode() === 'detail') {
        @if (current(); as t) {
        <button type="button" class="mt-6 text-sm text-text-muted hover:text-text" (click)="backToList()">← Mes demandes</button>
        <div class="jz-card mt-3">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="font-mono text-xs text-text-muted">{{ typeLabels[t.type] }}</p>
              <h2 class="mt-1 text-lg font-semibold">{{ t.subject }}</h2>
            </div>
            <span class="rounded-full px-2.5 py-1 font-mono text-xs" [class]="badge(t.status)">{{ statusLabels[t.status] }}</span>
          </div>

          <div class="mt-5 space-y-3">
            @for (m of t.messages; track m.id) {
              <div class="rounded-card border border-border p-3" [class.bg-surface-raised]="m.fromAdmin">
                <p class="mb-1 font-mono text-[11px] text-text-muted">{{ m.fromAdmin ? 'Équipe Jobzz' : 'Toi' }} · {{ date(m.createdAt) }}</p>
                <p class="whitespace-pre-line text-sm">{{ m.body }}</p>
                @if (m.hasAttachment) {
                  <a [href]="attachmentUrl(m.id)" target="_blank" class="mt-2 inline-block text-xs text-accent underline">Voir la pièce jointe</a>
                }
              </div>
            }
          </div>

          @if (t.status !== 'resolu') {
            <form [formGroup]="replyForm" (ngSubmit)="sendReply()" class="mt-5 space-y-3 border-t border-border pt-4">
              <textarea class="jz-input min-h-20" formControlName="body" maxlength="5000" placeholder="Ta réponse…"></textarea>
              <input type="file" accept="image/png,image/jpeg,image/webp" (change)="pickFile($event)" class="text-sm text-text-secondary" />
              @if (error()) {
                <p class="text-sm text-danger">{{ error() }}</p>
              }
              <button type="submit" class="jz-btn-primary" [disabled]="replyForm.invalid || busy()">
                {{ busy() ? 'Envoi…' : 'Répondre' }}
              </button>
            </form>
          } @else {
            <p class="mt-5 border-t border-border pt-4 text-sm text-text-muted">Cette demande est résolue.</p>
          }
        </div>
        }
      }

      <!-- Liste -->
      @else {
        @if (loading()) {
          <div class="jz-card mt-6 h-32 animate-pulse"></div>
        } @else if (tickets().length === 0) {
          <div class="jz-card mt-6 text-center">
            <p class="text-text-secondary">Tu n'as pas encore de demande.</p>
            <button type="button" class="jz-btn-primary mt-4" (click)="startNew()">Nouvelle demande</button>
          </div>
        } @else {
          <ul class="mt-6 space-y-2">
            @for (t of tickets(); track t.id) {
              <li>
                <button
                  type="button"
                  (click)="openTicket(t.id)"
                  class="jz-card flex w-full items-center justify-between gap-4 text-left transition-colors hover:bg-surface-raised"
                >
                  <div class="min-w-0">
                    <p class="truncate font-medium">{{ t.subject }}</p>
                    <p class="font-mono text-xs text-text-muted">{{ typeLabels[t.type] }} · {{ t.messageCount }} message(s) · {{ date(t.updatedAt) }}</p>
                  </div>
                  <span class="shrink-0 rounded-full px-2.5 py-1 font-mono text-xs" [class]="badge(t.status)">{{ statusLabels[t.status] }}</span>
                </button>
              </li>
            }
          </ul>
        }
      }
    </div>
  `,
})
export class DemandesComponent {
  private readonly fb = inject(FormBuilder);
  private readonly support = inject(SupportService);

  readonly types = TICKET_TYPES;
  readonly typeLabels = TICKET_TYPE_LABELS;
  readonly statusLabels = TICKET_STATUS_LABELS;

  readonly mode = signal<'list' | 'new' | 'detail'>('list');
  readonly tickets = signal<TicketSummary[]>([]);
  readonly current = signal<PublicTicket | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  private file: File | null = null;

  readonly form = this.fb.nonNullable.group({
    type: ['question' as TicketType, Validators.required],
    subject: ['', [Validators.required, Validators.minLength(3)]],
    message: ['', [Validators.required, Validators.minLength(1)]],
  });

  readonly replyForm = this.fb.nonNullable.group({
    body: ['', [Validators.required, Validators.minLength(1)]],
  });

  constructor() {
    void this.loadList();
  }

  badge(status: TicketStatus): string {
    if (status === 'en_cours') return 'bg-warning/10 text-warning';
    if (status === 'resolu') return 'bg-accent-bg text-accent';
    return 'bg-surface-raised text-text-secondary';
  }

  date(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  attachmentUrl(messageId: string): string {
    return this.support.attachmentUrl(messageId);
  }

  startNew(): void {
    this.form.reset({ type: 'question', subject: '', message: '' });
    this.file = null;
    this.error.set(null);
    this.mode.set('new');
  }

  backToList(): void {
    this.current.set(null);
    this.mode.set('list');
    void this.loadList();
  }

  pickFile(event: Event): void {
    this.file = (event.target as HTMLInputElement).files?.[0] ?? null;
  }

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      const ticket = await this.support.createTicket(this.form.getRawValue(), this.file);
      this.file = null;
      this.current.set(ticket);
      this.mode.set('detail');
    } catch (err) {
      this.error.set(errorMessage(err, "Impossible d'envoyer ta demande."));
    } finally {
      this.busy.set(false);
    }
  }

  async openTicket(id: string): Promise<void> {
    this.error.set(null);
    this.current.set(await this.support.getTicket(id));
    this.mode.set('detail');
  }

  async sendReply(): Promise<void> {
    const ticket = this.current();
    if (!ticket || this.replyForm.invalid) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      const updated = await this.support.reply(ticket.id, this.replyForm.getRawValue().body, this.file);
      this.file = null;
      this.replyForm.reset({ body: '' });
      this.current.set(updated);
    } catch (err) {
      this.error.set(errorMessage(err, "Impossible d'envoyer ta réponse."));
    } finally {
      this.busy.set(false);
    }
  }

  private async loadList(): Promise<void> {
    this.loading.set(true);
    try {
      this.tickets.set(await this.support.listTickets());
    } finally {
      this.loading.set(false);
    }
  }
}
