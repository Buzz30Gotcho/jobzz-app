import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

/** En-tête commun de la page Offres : titre, bouton Nouvelle automatisation (étape 6), onglets. */
@Component({
  selector: 'jz-offres-tabs',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Offres</h1>
    </div>
    <nav class="mt-4 inline-flex rounded-field bg-surface-raised p-1" aria-label="Onglets des offres">
      <a
        routerLink="/app/offres"
        routerLinkActive="bg-surface text-text shadow-sm"
        [routerLinkActiveOptions]="{ exact: true }"
        class="rounded-[6px] px-4 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text"
        >Rechercher</a
      >
      <a
        routerLink="/app/offres/automatisations"
        routerLinkActive="bg-surface text-text shadow-sm"
        class="rounded-[6px] px-4 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text"
        >Mes automatisations</a
      >
    </nav>
  `,
})
export class OffresTabsComponent {}
