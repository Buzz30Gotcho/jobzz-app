import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

/**
 * Accueil de l'application (placeholder de socle). Le vrai tableau de bord — « Tes buzz du
 * jour », « Bien démarrer », récap de la semaine — arrive aux étapes 3 et 9.
 */
@Component({
  selector: 'jz-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="mx-auto max-w-4xl">
      <h1 class="text-2xl font-semibold">
        Salut{{ prenom() }} <span aria-hidden="true">👋</span>
      </h1>
      <p class="mt-2 text-text-secondary">
        Ton espace Jobzz est prêt. Les écrans « Relances », « Offres » et « Profil » se remplissent
        au fil des prochaines étapes.
      </p>

      @if (!auth.user()?.emailVerified) {
        <div class="jz-card mt-6 border-warning/40">
          <p class="text-sm text-text-secondary">
            Pense à confirmer ton adresse email (lien envoyé à l'inscription) pour recevoir le mail
            des offres.
          </p>
        </div>
      }

      <div class="mt-8 grid gap-4 sm:grid-cols-3">
        <a routerLink="/app/offres" class="jz-card hover:border-accent">
          <h2 class="font-semibold">Chercher des offres</h2>
          <p class="mt-1 text-sm text-text-secondary">Bientôt disponible.</p>
        </a>
        <a routerLink="/app/relances" class="jz-card hover:border-accent">
          <h2 class="font-semibold">Mes relances</h2>
          <p class="mt-1 text-sm text-text-secondary">Bientôt disponible.</p>
        </a>
        <a routerLink="/app/profil" class="jz-card hover:border-accent">
          <h2 class="font-semibold">Mon profil</h2>
          <p class="mt-1 text-sm text-text-secondary">Bientôt disponible.</p>
        </a>
      </div>
    </div>
  `,
})
export class DashboardComponent {
  readonly auth = inject(AuthService);

  prenom(): string {
    // Le prénom viendra du profil (étape 2) ; pour l'instant on reste sobre.
    return '';
  }
}
