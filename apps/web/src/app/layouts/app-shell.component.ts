import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../core/auth/auth.service';
import { ApplicationsService } from '../core/applications/applications.service';
import { ThemeService } from '../core/theme/theme.service';
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
      </aside>

      <!-- Contenu -->
      <div class="flex min-w-0 flex-1 flex-col">
        <header class="flex items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-8">
          <!-- Logo seulement sur mobile (la barre latérale le porte sur ordinateur). -->
          <jz-logo class="md:hidden" />
          <div class="hidden md:block"></div>

          <div class="flex items-center gap-1">
            <a
              routerLink="/app/aide"
              aria-label="Aide"
              class="flex h-9 w-9 items-center justify-center rounded-field text-text-muted transition-colors hover:bg-surface-raised hover:text-text"
            >
              <lucide-icon name="help-circle" [size]="18" />
            </a>
            <button
              type="button"
              (click)="theme.toggle()"
              [attr.aria-label]="theme.theme() === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'"
              class="flex h-9 w-9 items-center justify-center rounded-field text-text-muted transition-colors hover:bg-surface-raised hover:text-text"
            >
              <lucide-icon [name]="theme.theme() === 'dark' ? 'sun' : 'moon'" [size]="18" />
            </button>

            <!-- Menu compte -->
            <div class="relative">
              <button
                type="button"
                (click)="menuOpen.set(!menuOpen())"
                aria-haspopup="menu"
                [attr.aria-expanded]="menuOpen()"
                aria-label="Mon compte"
                class="flex h-9 w-9 items-center justify-center rounded-full bg-surface-raised font-mono text-sm font-medium text-text transition-colors hover:bg-border"
              >
                {{ initial() }}
              </button>
              @if (menuOpen()) {
                <!-- Fond transparent : un clic en dehors ferme le menu. -->
                <div class="fixed inset-0 z-20" (click)="menuOpen.set(false)"></div>
                <div
                  role="menu"
                  class="absolute right-0 z-30 mt-2 w-56 rounded-card border border-border bg-surface p-1 shadow-lg"
                >
                  <p class="truncate px-3 py-2 text-xs text-text-muted">{{ auth.user()?.email }}</p>
                  @if (auth.isAdmin()) {
                    <a
                      role="menuitem"
                      routerLink="/admin"
                      (click)="menuOpen.set(false)"
                      class="flex items-center gap-3 rounded-field px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-raised hover:text-text"
                    >
                      <lucide-icon name="shield" [size]="16" /> Admin
                    </a>
                  }
                  <button
                    role="menuitem"
                    type="button"
                    (click)="logout()"
                    class="flex w-full items-center gap-3 rounded-field px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-raised hover:text-text"
                  >
                    <lucide-icon name="log-out" [size]="16" /> Déconnexion
                  </button>
                </div>
              }
            </div>
          </div>
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
  readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  /** Menu compte (haut à droite) ouvert ou non. */
  readonly menuOpen = signal(false);

  /** Initiale affichée dans le bouton compte : prénom si connu, sinon email. */
  readonly initial = computed(() => {
    const u = this.auth.user();
    return (u?.firstName || u?.email || '?').charAt(0).toUpperCase();
  });

  @HostListener('document:keydown.escape')
  closeMenu(): void {
    this.menuOpen.set(false);
  }

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
    this.menuOpen.set(false);
    await this.auth.logout();
    await this.router.navigate(['/']);
  }
}
