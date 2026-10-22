import { Component, inject, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ApplicationsService } from '../../../core/applications/applications.service';

/** En-tête commun de la page Relances : titre, bouton « Écrire à une entreprise », onglets. */
@Component({
  selector: 'jz-relances-tabs',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Relances</h1>
      <button type="button" class="jz-btn-ghost" (click)="write.emit()">
        <lucide-icon name="pen-line" [size]="16" /> Écrire à une entreprise
      </button>
    </div>

    <nav class="mt-4 inline-flex rounded-field bg-surface-raised p-1" aria-label="Onglets des relances">
      <a
        routerLink="/app/relances"
        routerLinkActive="bg-surface text-text shadow-sm"
        [routerLinkActiveOptions]="{ exact: true }"
        class="flex items-center gap-2 rounded-[6px] px-4 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text"
      >
        À buzzer
        @if (applications.dueCount() > 0) {
          <span class="rounded-full bg-accent px-1.5 font-mono text-xs text-accent-ink">{{ applications.dueCount() }}</span>
        }
      </a>
      <a
        routerLink="/app/relances/candidatures"
        routerLinkActive="bg-surface text-text shadow-sm"
        class="rounded-[6px] px-4 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text"
        >Mes candidatures</a
      >
    </nav>
  `,
})
export class RelancesTabsComponent {
  readonly applications = inject(ApplicationsService);
  readonly write = output<void>();
}
