import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** Sous-navigation du Profil (CLAUDE.md §11) : Mes infos · Mon CV · Paramètres. */
@Component({
  selector: 'jz-profil-tabs',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="mt-4 inline-flex rounded-field bg-surface-raised p-1" aria-label="Sections du profil">
      <a
        routerLink="/app/profil"
        routerLinkActive="bg-surface text-text shadow-sm"
        [routerLinkActiveOptions]="{ exact: true }"
        class="rounded-[6px] px-4 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text"
        >Mes infos</a
      >
      <a
        routerLink="/app/profil/cv"
        routerLinkActive="bg-surface text-text shadow-sm"
        class="rounded-[6px] px-4 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text"
        >Mon CV</a
      >
      <a
        routerLink="/app/profil/parametres"
        routerLinkActive="bg-surface text-text shadow-sm"
        class="rounded-[6px] px-4 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text"
        >Paramètres</a
      >
    </nav>
  `,
})
export class ProfilTabsComponent {}
