import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { LogoComponent } from '../shared/logo.component';

@Component({
  selector: 'jz-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, LogoComponent],
  template: `
    <div class="flex min-h-full flex-col">
      <header class="border-b border-border">
        <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <a routerLink="/" aria-label="Accueil Jobzz"><jz-logo /></a>
          <nav class="flex items-center gap-2 text-sm">
            <a routerLink="/pourquoi-jobzz" class="jz-btn-ghost hidden sm:inline-flex"
              >Pourquoi Jobzz</a
            >
            @if (auth.isAuthenticated()) {
              <a routerLink="/app" class="jz-btn-primary">Ouvrir l'app</a>
            } @else {
              <a routerLink="/connexion" class="jz-btn-ghost">Connexion</a>
              <a routerLink="/inscription" class="jz-btn-primary">Créer mon compte</a>
            }
          </nav>
        </div>
      </header>

      <main class="flex-1"><router-outlet /></main>

      <footer class="border-t border-border">
        <div
          class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-text-muted sm:flex-row"
        >
          <span>© {{ year }} Jobzz — les débuts de carrière, enfin bien servis.</span>
          <a routerLink="/pourquoi-jobzz" class="hover:text-text">Pourquoi Jobzz</a>
        </div>
      </footer>
    </div>
  `,
})
export class PublicLayoutComponent {
  readonly auth = inject(AuthService);
  readonly year = new Date().getFullYear();
}
