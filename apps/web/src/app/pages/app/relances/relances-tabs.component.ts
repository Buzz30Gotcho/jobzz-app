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

    <nav class="mt-4 flex gap-2 border-b border-border" aria-label="Onglets des relances">
      <a
        routerLink="/app/relances"
        routerLinkActive="border-accent text-text"
        [routerLinkActiveOptions]="{ exact: true }"
        class="-mb-px flex items-center gap-2 border-b-2 border-transparent px-3 py-2 text-sm text-text-secondary hover:text-text"
      >
        À buzzer
        @if (applications.dueCount() > 0) {
          <span class="rounded-full bg-accent px-1.5 font-mono text-xs text-accent-ink">{{ applications.dueCount() }}</span>
        }
      </a>
      <a
        routerLink="/app/relances/candidatures"
        routerLinkActive="border-accent text-text"
        class="-mb-px border-b-2 border-transparent px-3 py-2 text-sm text-text-secondary hover:text-text"
        >Mes candidatures</a
      >
    </nav>
  `,
})
export class RelancesTabsComponent {
  readonly applications = inject(ApplicationsService);
  readonly write = output<void>();
}
