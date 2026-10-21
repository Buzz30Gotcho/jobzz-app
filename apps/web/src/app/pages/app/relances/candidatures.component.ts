import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import {
  APPLICATION_FILTERS,
  type ApplicationFilter,
  type ApplicationStatus,
  type PublicApplication,
  type ResponseType,
} from '@jobzz/shared';
import { ApplicationsService } from '../../../core/applications/applications.service';
import { RelancesTabsComponent } from './relances-tabs.component';
import { BuzzDialogComponent } from './buzz-dialog.component';
import { FreeSendDialogComponent } from './free-send-dialog.component';

const FILTER_LABELS: Record<ApplicationFilter, string> = {
  toutes: 'Toutes',
  en_attente: 'En attente',
  relancee: 'Relancées',
  reponse_recue: 'Réponse reçue',
  archivees: 'Archivées',
};
const STATUS_LABELS: Record<ApplicationStatus, string> = {
  en_attente: 'En attente',
  relancee: 'Relancée',
  reponse_recue: 'Réponse reçue',
};
const RESPONSE_LABELS: Record<ResponseType, string> = {
  entretien: 'Entretien',
  refus: 'Refus',
  autre: 'Autre réponse',
};

/** Onglet « Mes candidatures » : retrouver une candidature, signaler une réponse (CLAUDE.md §4.3). */
@Component({
  selector: 'jz-candidatures',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, RelancesTabsComponent, BuzzDialogComponent, FreeSendDialogComponent],
  template: `
    <div class="mx-auto max-w-3xl">
      <jz-relances-tabs (write)="writing.set(true)" />

      <!-- Filtres (une pilule active à la fois) + recherche -->
      <div class="mt-6 flex flex-wrap items-center gap-2">
        @for (f of filters; track f) {
          <button
            type="button"
            (click)="setFilter(f)"
            [class]="
              filter() === f
                ? 'rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-ink'
                : 'rounded-full border border-border px-3 py-1 text-sm text-text-secondary hover:text-text'
            "
          >
            {{ filterLabels[f] }}
          </button>
        }
      </div>
      <div class="mt-3">
        <input
          class="jz-input"
          placeholder="Rechercher une entreprise…"
          [(ngModel)]="search"
          (ngModelChange)="onSearch()"
        />
      </div>

      <div class="mt-6">
        @if (loading()) {
          <div class="h-24 animate-pulse rounded-card bg-surface-raised"></div>
        } @else if (items().length === 0) {
          <p class="jz-card text-center text-sm text-text-secondary">Aucune candidature ici pour l'instant.</p>
        } @else {
          <ul class="space-y-3">
            @for (app of items(); track app.id) {
              <li class="jz-card">
                <div class="flex items-start justify-between gap-4">
                  <div class="min-w-0">
                    <p class="truncate font-medium">{{ app.companyName }}</p>
                    <p class="truncate text-sm text-text-secondary">{{ app.position }}</p>
                    <p class="mt-1 text-xs text-text-muted">Candidature du {{ date(app.appliedAt) }}</p>
                  </div>
                  <span class="shrink-0 rounded-full bg-surface-raised px-2.5 py-1 text-xs" [class]="statusClass(app)">
                    {{ statusLabel(app) }}
                  </span>
                </div>

                @if (!app.archivedAt) {
                  <div class="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    @if (app.status !== 'reponse_recue') {
                      <button type="button" class="jz-btn-ghost px-3 py-1.5 text-sm" (click)="buzzing.set(app)">
                        <lucide-icon name="bell" [size]="14" /> Buzzer
                      </button>
                      <span class="text-xs text-text-muted">A répondu ?</span>
                      @for (r of responseTypes; track r) {
                        <button type="button" class="rounded-field border border-border px-2.5 py-1 text-xs hover:border-accent" (click)="respond(app, r)">
                          {{ responseLabels[r] }}
                        </button>
                      }
                    } @else {
                      <span class="text-sm" [class.text-accent]="app.responseType === 'entretien'">
                        {{ app.responseType ? responseLabels[app.responseType] : 'Réponse reçue' }}
                        @if (app.responseType === 'entretien') { 🎉 }
                      </span>
                    }
                    <button type="button" class="ml-auto text-xs text-text-muted hover:text-text" (click)="archive(app)">
                      Archiver
                    </button>
                  </div>
                }
              </li>
            }
          </ul>
        }
      </div>
    </div>

    @if (buzzing(); as app) {
      <jz-buzz-dialog [application]="app" (done)="afterChange()" (closed)="buzzing.set(null)" />
    }
    @if (writing()) {
      <jz-free-send-dialog (done)="afterWrite()" (closed)="writing.set(false)" />
    }
  `,
})
export class CandidaturesComponent implements OnInit {
  private readonly applications = inject(ApplicationsService);

  readonly filters = APPLICATION_FILTERS;
  readonly filterLabels = FILTER_LABELS;
  readonly responseLabels = RESPONSE_LABELS;
  readonly responseTypes: ResponseType[] = ['entretien', 'refus', 'autre'];

  readonly items = signal<PublicApplication[]>([]);
  readonly loading = signal(true);
  readonly filter = signal<ApplicationFilter>('toutes');
  readonly buzzing = signal<PublicApplication | null>(null);
  readonly writing = signal(false);
  search = '';

  private searchDebounce?: ReturnType<typeof setTimeout>;

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  private async reload(): Promise<void> {
    this.loading.set(true);
    try {
      this.items.set(await this.applications.list(this.filter(), this.search.trim() || undefined));
    } finally {
      this.loading.set(false);
    }
  }

  setFilter(f: ApplicationFilter): void {
    this.filter.set(f);
    void this.reload();
  }

  onSearch(): void {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => void this.reload(), 300);
  }

  date(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR');
  }

  statusLabel(app: PublicApplication): string {
    if (app.archivedAt) return 'Archivée';
    return STATUS_LABELS[app.status];
  }

  statusClass(app: PublicApplication): string {
    if (app.status === 'reponse_recue' && app.responseType === 'entretien') return 'text-accent';
    return 'text-text-secondary';
  }

  async respond(app: PublicApplication, responseType: ResponseType): Promise<void> {
    await this.applications.respond(app.id, responseType);
    await this.afterChange();
  }

  async archive(app: PublicApplication): Promise<void> {
    await this.applications.archive(app.id);
    await this.reload();
  }

  async afterChange(): Promise<void> {
    this.buzzing.set(null);
    await Promise.all([this.reload(), this.applications.due()]);
  }

  async afterWrite(): Promise<void> {
    this.writing.set(false);
    await Promise.all([this.reload(), this.applications.due()]);
  }
}
