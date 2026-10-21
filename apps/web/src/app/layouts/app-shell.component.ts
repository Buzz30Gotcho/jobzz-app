import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../core/auth/auth.service';
import { ApplicationsService } from '../core/applications/applications.service';
import { LogoComponent } from '../shared/logo.component';

interface NavEntry {
  path: string;
  label: string;
  icon: string;
}

/** Coquille de l'application : navigation latérale sur ordinateur, barre en bas sur mobile. */
@Component({
  selector: 'jz-app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, LogoComponent],
  template: `
    <div class="flex min-h-full">
      <!-- Navigation latérale (ordinateur) : 4 entrées seulement. -->
      <aside class="hidden w-60 shrink-0 flex-col border-r border-border p-4 md:flex">
        <a routerLink="/app" class="mb-8 px-2" aria-label="Accueil Jobzz"><jz-logo /></a>

        <nav class="flex flex-1 flex-col gap-1">
          @for (entry of nav; track entry.path) {
            <a
              [routerLink]="entry.path"
              routerLinkActive="bg-surface-raised text-text"
              [routerLinkActiveOptions]="{ exact: entry.path === '/app' }"
              class="flex items-center gap-3 rounded-field px-3 py-2.5 text-text-secondary transition-colors hover:bg-surface-raised hover:text-text"
            >
              <lucide-icon [name]="entry.icon" [size]="18" />
              <span>{{ entry.label }}</span>
              @if (entry.path === '/app/relances' && applications.dueCount() > 0) {
                <span class="ml-auto rounded-full bg-accent px-1.5 font-mono text-xs text-accent-ink">{{ applications.dueCount() }}</span>
              }
            </a>
          }
        </nav>

        <div class="mt-auto flex flex-col gap-1 border-t border-border pt-3">
          <a
            routerLink="/app/aide"
            class="flex items-center gap-3 rounded-field px-3 py-2 text-sm text-text-muted hover:text-text"
          >
            <lucide-icon name="help-circle" [size]="16" /> Aide
          </a>
          @if (auth.isAdmin()) {
            <a
              routerLink="/admin"
              class="flex items-center gap-3 rounded-field px-3 py-2 text-sm text-text-muted hover:text-text"
            >
              <lucide-icon name="shield" [size]="16" /> Admin
            </a>
          }
          <button
            type="button"
            (click)="logout()"
            class="flex items-center gap-3 rounded-field px-3 py-2 text-sm text-text-muted hover:text-text"
          >
            <lucide-icon name="log-out" [size]="16" /> Déconnexion
          </button>
        </div>
      </aside>

      <!-- Contenu -->
      <div class="flex min-w-0 flex-1 flex-col">
        <header class="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
          <jz-logo />
          <a routerLink="/app/aide" aria-label="Aide"><lucide-icon name="help-circle" [size]="20" /></a>
        </header>

        <main class="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-10">
          <router-outlet />
        </main>
      </div>

      <!-- Barre du bas (mobile) -->
      <nav
        class="fixed inset-x-0 bottom-0 z-10 flex border-t border-border bg-surface md:hidden"
        aria-label="Navigation principale"
      >
        @for (entry of nav; track entry.path) {
          <a
            [routerLink]="entry.path"
            routerLinkActive="text-accent"
            [routerLinkActiveOptions]="{ exact: entry.path === '/app' }"
            class="flex flex-1 flex-col items-center gap-1 py-2 text-xs text-text-muted"
          >
            <lucide-icon [name]="entry.icon" [size]="20" />
            {{ entry.label }}
          </a>
        }
      </nav>
    </div>
  `,
})
export class AppShellComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly applications = inject(ApplicationsService);
  private readonly router = inject(Router);

  async ngOnInit(): Promise<void> {
    // Alimente le badge « buzz du jour » du menu (ignore les erreurs réseau).
    await this.applications.due().catch(() => []);
  }

  readonly nav: NavEntry[] = [
    { path: '/app', label: 'Accueil', icon: 'home' },
    { path: '/app/relances', label: 'Relances', icon: 'bell' },
    { path: '/app/offres', label: 'Offres', icon: 'search' },
    { path: '/app/profil', label: 'Profil', icon: 'user' },
  ];

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/']);
  }
}
