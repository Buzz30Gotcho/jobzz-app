import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

type State = 'pending' | 'success' | 'error';

@Component({
  selector: 'jz-verify-email',
  standalone: true,
  imports: [RouterLink],
  template: `
    <h1 class="text-xl font-semibold">Confirmation de l'email</h1>

    @switch (state()) {
      @case ('pending') {
        <p class="mt-4 text-text-secondary">Vérification en cours…</p>
      }
      @case ('success') {
        <p class="mt-4 text-text-secondary">
          C'est confirmé, merci ! Tu peux maintenant recevoir le mail des offres.
        </p>
        <a routerLink="/app" class="jz-btn-primary mt-6 w-full">Aller à l'application</a>
      }
      @case ('error') {
        <p class="mt-4 text-text-secondary">
          Ce lien est invalide ou a expiré. Reconnecte-toi pour en renvoyer un depuis l'application.
        </p>
        <a routerLink="/connexion" class="jz-btn-ghost mt-6 w-full">Se connecter</a>
      }
    }
  `,
})
export class VerifyEmailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  readonly state = signal<State>('pending');

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.state.set('error');
    } else {
      this.auth
        .verifyEmail(token)
        .then(() => this.state.set('success'))
        .catch(() => this.state.set('error'));
    }
  }
}
