import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

/**
 * Page de désinscription du mail des offres (CLAUDE.md §4.6) : lien en un clic depuis les mails.
 * Lit le jeton signé dans l'URL et coupe le mail des offres (le compte reste intact).
 */
@Component({
  selector: 'jz-desinscription',
  standalone: true,
  template: `
    <section class="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 class="text-2xl font-bold">Désinscription du mail des offres</h1>
      @switch (state()) {
        @case ('loading') {
          <p class="mt-4 text-text-secondary">Traitement en cours…</p>
        }
        @case ('done') {
          <p class="mt-4 text-text-secondary">
            C'est fait : tu ne recevras plus le mail des offres. Ton compte et tes données restent intacts.
          </p>
          <p class="mt-2 text-sm text-text-muted">
            Tu peux le réactiver à tout moment depuis Profil → Paramètres.
          </p>
        }
        @default {
          <p class="mt-4 text-text-secondary">
            Ce lien de désinscription est invalide ou expiré. Tu peux gérer le mail des offres depuis
            Profil → Paramètres.
          </p>
        }
      }
    </section>
  `,
})
export class DesinscriptionComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  readonly state = signal<'loading' | 'done' | 'error'>('loading');

  async ngOnInit(): Promise<void> {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.state.set('error');
      return;
    }
    try {
      await firstValueFrom(this.http.post('/api/automations/unsubscribe', { token }));
      this.state.set('done');
    } catch {
      this.state.set('error');
    }
  }
}
