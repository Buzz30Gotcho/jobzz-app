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
    <nav class="mt-4 flex gap-2 border-b border-border" aria-label="Onglets des offres">
      <a
        routerLink="/app/offres"
        routerLinkActive="border-accent text-text"
        [routerLinkActiveOptions]="{ exact: true }"
        class="-mb-px border-b-2 border-transparent px-3 py-2 text-sm text-text-secondary hover:text-text"
        >Rechercher</a
      >
      <a
        routerLink="/app/offres/automatisations"
        routerLinkActive="border-accent text-text"
        class="-mb-px border-b-2 border-transparent px-3 py-2 text-sm text-text-secondary hover:text-text"
        >Mes automatisations</a
      >
    </nav>
  `,
})
export class OffresTabsComponent {}
