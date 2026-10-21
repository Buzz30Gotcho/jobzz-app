import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PRICING } from '@jobzz/shared';

/**
 * Page Tarifs (publique). Le paiement Stripe est branché à l'étape 8 ; ici, la présentation.
 * En local avec PLAN_ENFORCEMENT=false, cette page reste atteignable par URL mais n'est pas
 * mise en avant dans l'app.
 */
@Component({
  selector: 'jz-tarifs',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-5xl px-4 py-16">
      <h1 class="text-center text-3xl font-bold">Des tarifs simples</h1>
      <p class="mx-auto mt-3 max-w-xl text-center text-text-secondary">
        Le gratuit est déjà utile. Le Premium débloque l'IA et les automatisations qui tournent en
        continu.
      </p>

      <div class="mt-12 grid gap-6 md:grid-cols-3">
        <div class="jz-card">
          <h2 class="text-lg font-semibold">Gratuit</h2>
          <p class="mt-2 font-mono text-3xl">0 €</p>
          <p class="mt-4 text-sm text-text-secondary">
            Recherche d'offres, relances, 1 automatisation découverte, analyse du CV par règles.
          </p>
        </div>

        <div class="jz-card border-accent">
          <h2 class="text-lg font-semibold">Premium</h2>
          <p class="mt-2 font-mono text-3xl">{{ pricing.monthly }} € <span class="text-base text-text-muted">/ mois</span></p>
          <p class="mt-4 text-sm text-text-secondary">
            Toutes les offres, 5 automatisations, IA (messages, analyse CV, assistant), sans
            engagement.
          </p>
          <a routerLink="/inscription" class="jz-btn-primary mt-6 w-full">Commencer</a>
        </div>

        <div class="jz-card">
          <h2 class="text-lg font-semibold">Pass 3 mois</h2>
          <p class="mt-2 font-mono text-3xl">{{ pricing.pass3Months }} €</p>
          <p class="mt-4 text-sm text-text-secondary">
            Tout le Premium pendant 3 mois, payé en une fois, sans renouvellement automatique.
          </p>
        </div>
      </div>

      <p class="mt-8 text-center text-sm text-text-muted">
        Offre de lancement : {{ pricing.launch }} € / mois à vie pour les
        {{ pricing.launchSeats }} premiers abonnés.
      </p>
    </section>
  `,
})
export class TarifsComponent {
  readonly pricing = PRICING;
}
