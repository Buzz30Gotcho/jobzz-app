import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LogoComponent } from '../shared/logo.component';

/**
 * Coquille de l'espace admin : thème noir et blanc (classe `theme-admin`), badge permanent
 * « Mode admin » et bouton « Retour à l'appli » (CLAUDE.md §4.11, §11). Aucun vert ici.
 */
@Component({
  selector: 'jz-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, LogoComponent],
  host: { class: 'theme-admin' },
  template: `
    <div class="flex min-h-screen flex-col bg-bg text-text">
      <header class="flex items-center justify-between border-b border-border px-4 py-3">
        <div class="flex items-center gap-3">
          <jz-logo />
          <span
            class="rounded-full border border-border px-2 py-0.5 font-mono text-xs uppercase tracking-wide text-text-secondary"
            >Mode admin</span
          >
        </div>
        <a routerLink="/app" class="jz-btn-ghost text-sm">Retour à l'appli</a>
      </header>
      <main class="flex-1 px-4 py-6 md:px-8"><router-outlet /></main>
    </div>
  `,
})
export class AdminShellComponent {
  // Le thème admin est appliqué par la classe `theme-admin` sur l'hôte.
}
