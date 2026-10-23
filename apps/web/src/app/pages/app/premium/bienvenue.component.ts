import { Component, OnDestroy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { BillingService } from '../../../core/billing/billing.service';

/**
 * Retour de Stripe Checkout (CLAUDE.md §2.1). Le compte devient Premium **dès la réception du
 * webhook**, jamais sur la simple redirection. On interroge donc le serveur jusqu'à confirmation.
 */
@Component({
  selector: 'jz-premium-bienvenue',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-lg px-4 py-20 text-center">
      @if (confirmed()) {
        <div class="text-5xl">🎉</div>
        <h1 class="mt-4 text-3xl font-bold">Bienvenue en Premium&nbsp;!</h1>
        <p class="mt-3 text-text-secondary">
          Toutes les offres, 5 automatisations et l'IA sont débloquées. À toi de jouer.
        </p>
        <div class="mt-8 flex justify-center gap-3">
          <a routerLink="/app/offres" class="jz-btn-primary">Chercher des offres</a>
          <a routerLink="/app/profil/abonnement" class="jz-btn-ghost">Mon abonnement</a>
        </div>
      } @else if (timedOut()) {
        <h1 class="text-2xl font-bold">Paiement presque confirmé…</h1>
        <p class="mt-3 text-text-secondary">
          La confirmation de Stripe peut prendre quelques instants. Ton Premium s'activera
          automatiquement dès réception — pas besoin de payer à nouveau.
        </p>
        <div class="mt-8 flex justify-center gap-3">
          <button type="button" class="jz-btn-primary" (click)="retry()">Vérifier à nouveau</button>
          <a routerLink="/app" class="jz-btn-ghost">Retour à l'accueil</a>
        </div>
      } @else {
        <div class="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent"></div>
        <h1 class="mt-6 text-2xl font-bold">Paiement en cours de confirmation…</h1>
        <p class="mt-3 text-text-secondary">On attend la confirmation de Stripe. Reste sur cette page.</p>
      }
    </section>
  `,
})
export class PremiumBienvenueComponent implements OnDestroy {
  private readonly billing = inject(BillingService);
  private readonly auth = inject(AuthService);

  readonly confirmed = signal(false);
  readonly timedOut = signal(false);

  private attempts = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.poll();
  }

  retry(): void {
    this.attempts = 0;
    this.timedOut.set(false);
    this.poll();
  }

  private poll(): void {
    void this.check();
  }

  private async check(): Promise<void> {
    this.attempts += 1;
    try {
      const overview = await this.billing.overview();
      if (overview.isPremium) {
        // Rafraîchit le jeton pour que le plan (embarqué dans le JWT) soit à jour partout.
        await this.auth.refresh();
        this.confirmed.set(true);
        return;
      }
    } catch {
      // On réessaie : la confirmation peut arriver avec un léger délai.
    }
    if (this.attempts >= 15) {
      this.timedOut.set(true);
      return;
    }
    this.timer = setTimeout(() => this.poll(), 2000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }
}
