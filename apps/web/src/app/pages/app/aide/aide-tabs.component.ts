import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** Onglets de l'Aide (CLAUDE.md §4.10) : Questions fréquentes · Mes demandes. */
@Component({
  selector: 'jz-aide-tabs',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="mt-4 inline-flex rounded-field bg-surface-raised p-1" aria-label="Sections de l'aide">
      <a
        routerLink="/app/aide"
        routerLinkActive="bg-surface text-text shadow-sm"
        [routerLinkActiveOptions]="{ exact: true }"
        class="rounded-[6px] px-4 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text"
        >Questions fréquentes</a
      >
      <a
        routerLink="/app/aide/demandes"
        routerLinkActive="bg-surface text-text shadow-sm"
        class="rounded-[6px] px-4 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text"
        >Mes demandes</a
      >
    </nav>
  `,
})
export class AideTabsComponent {}
