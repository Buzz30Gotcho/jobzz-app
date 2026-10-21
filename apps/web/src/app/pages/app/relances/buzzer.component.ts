import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import type { PublicApplication } from '@jobzz/shared';
import { ApplicationsService } from '../../../core/applications/applications.service';
import { RelancesTabsComponent } from './relances-tabs.component';
import { BuzzDialogComponent } from './buzz-dialog.component';
import { FreeSendDialogComponent } from './free-send-dialog.component';

/** Onglet « À buzzer » (par défaut) : les candidatures à relancer aujourd'hui (CLAUDE.md §4.3). */
@Component({
  selector: 'jz-buzzer',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, RelancesTabsComponent, BuzzDialogComponent, FreeSendDialogComponent],
  template: `
    <div class="mx-auto max-w-3xl">
      <jz-relances-tabs (write)="writing.set(true)" />

      <div class="mt-6">
        @if (loading()) {
          <div class="space-y-3">
            <div class="h-20 animate-pulse rounded-card bg-surface-raised"></div>
            <div class="h-20 animate-pulse rounded-card bg-surface-raised"></div>
          </div>
        } @else if (due().length === 0) {
          <div class="jz-card text-center">
            <lucide-icon name="bell" [size]="28" class="mx-auto text-text-muted" />
            <p class="mt-3 font-medium">Aucune relance pour aujourd'hui</p>
            <p class="mt-1 text-sm text-text-secondary">
              Clique sur « J'ai postulé » sur une offre de Jobzz, on te rappellera de relancer dans 7 jours.
            </p>
            <a routerLink="/app/offres" class="jz-btn-ghost mt-4 inline-flex">Chercher des offres</a>
          </div>
        } @else {
          <ul class="space-y-3">
            @for (app of due(); track app.id) {
              <li class="jz-card flex items-center justify-between gap-4">
                <div class="min-w-0">
                  <p class="truncate font-medium">{{ app.companyName }}</p>
                  <p class="truncate text-sm text-text-secondary">{{ app.position }}</p>
                  <p class="mt-1 text-xs text-text-muted">
                    {{ app.contactEmail ?? 'Sans email (LinkedIn)' }} · {{ relativeDays(app) }}
                  </p>
                </div>
                <button type="button" class="jz-btn-primary shrink-0" (click)="buzzing.set(app)">
                  <lucide-icon name="bell" [size]="16" /> Buzzer
                </button>
              </li>
            }
          </ul>
        }
      </div>
    </div>

    @if (buzzing(); as app) {
      <jz-buzz-dialog [application]="app" (done)="onBuzzed()" (closed)="buzzing.set(null)" />
    }
    @if (writing()) {
      <jz-free-send-dialog (done)="onWritten()" (closed)="writing.set(false)" />
    }
  `,
})
export class BuzzerComponent implements OnInit {
  private readonly applications = inject(ApplicationsService);

  readonly due = signal<PublicApplication[]>([]);
  readonly loading = signal(true);
  readonly buzzing = signal<PublicApplication | null>(null);
  readonly writing = signal(false);

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  private async reload(): Promise<void> {
    this.loading.set(true);
    try {
      this.due.set(await this.applications.due());
    } finally {
      this.loading.set(false);
    }
  }

  relativeDays(app: PublicApplication): string {
    const days = Math.floor((Date.now() - new Date(app.appliedAt).getTime()) / (24 * 60 * 60 * 1000));
    return days <= 0 ? "aujourd'hui" : `il y a ${days} jour${days > 1 ? 's' : ''}`;
  }

  async onBuzzed(): Promise<void> {
    this.buzzing.set(null);
    await this.reload();
  }

  async onWritten(): Promise<void> {
    this.writing.set(false);
    await this.reload();
  }
}
