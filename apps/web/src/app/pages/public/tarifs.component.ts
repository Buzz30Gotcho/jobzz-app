import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PRICING, type SubscriptionOffer } from '@jobzz/shared';
import { AuthService } from '../../core/auth/auth.service';
import { BillingService } from '../../core/billing/billing.service';

/**
 * Page Tarifs (publique, CLAUDE.md §2.1). Le paiement se fait sur les pages sécurisées de Stripe :
 * « Passer Premium » crée une session Checkout côté serveur et redirige vers Stripe.
 * Si Stripe n'est pas configuré, les boutons affichent « Paiement non configuré ».
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

      @if (!stripeConfigured()) {
        <p class="mx-auto mt-6 max-w-xl rounded-field border border-warning/40 bg-warning/10 px-4 py-3 text-center text-sm text-warning">
          Paiement non configuré sur cet environnement. Les offres sont présentées à titre
          indicatif.
        </p>
      }

      <div class="mt-12 grid gap-6 md:grid-cols-3">
        <div class="jz-card">
          <h2 class="text-lg font-semibold">Gratuit</h2>
          <p class="mt-2 font-mono text-3xl">0 €</p>
          <p class="mt-4 text-sm text-text-secondary">
            Recherche d'offres, relances, 1 automatisation découverte, analyse du CV par règles.
          </p>
        </div>

        <div class="jz-card border-accent">
          <h2 class="text-lg font-semibold">Premium mensuel</h2>
          <p class="mt-2 font-mono text-3xl">
            {{ pricing.monthly }} € <span class="text-base text-text-muted">/ mois</span>
          </p>
          <p class="mt-4 text-sm text-text-secondary">
            Toutes les offres, 5 automatisations, IA (messages, analyse CV, assistant), sans
            engagement.
          </p>
          <button
            type="button"
            class="jz-btn-primary mt-6 w-full"
            [disabled]="!stripeConfigured() || busy() === 'monthly'"
            (click)="subscribe('monthly')"
          >
            {{ busy() === 'monthly' ? 'Redirection…' : 'Passer Premium' }}
          </button>
        </div>

        <div class="jz-card">
          <h2 class="text-lg font-semibold">Pass 3 mois</h2>
          <p class="mt-2 font-mono text-3xl">{{ pricing.pass3Months }} €</p>
          <p class="mt-4 text-sm text-text-secondary">
            Tout le Premium pendant 3 mois, payé en une fois, sans renouvellement automatique.
          </p>
          <button
            type="button"
            class="jz-btn-ghost mt-6 w-full"
            [disabled]="!stripeConfigured() || busy() === 'pass_3_months'"
            (click)="subscribe('pass_3_months')"
          >
            {{ busy() === 'pass_3_months' ? 'Redirection…' : 'Prendre le Pass' }}
          </button>
        </div>
      </div>

      @if (launchSeats() !== null && launchSeats()! > 0) {
        <div class="jz-card mt-6 flex flex-col items-center gap-4 border-accent text-center md:flex-row md:justify-between md:text-left">
          <div>
            <h2 class="text-lg font-semibold">
              Offre de lancement — {{ pricing.launch }} € / mois à vie
            </h2>
            <p class="mt-1 text-sm text-text-secondary">
              Réservée aux {{ pricing.launchSeats }} premiers abonnés Premium.
              <span class="font-mono text-accent">Plus que {{ launchSeats() }} places.</span>
            </p>
          </div>
          <button
            type="button"
            class="jz-btn-primary shrink-0"
            [disabled]="!stripeConfigured() || busy() === 'launch'"
            (click)="subscribe('launch')"
          >
            {{ busy() === 'launch' ? 'Redirection…' : 'Profiter du lancement' }}
          </button>
        </div>
      }

      @if (error()) {
        <p class="mt-6 text-center text-sm text-danger">{{ error() }}</p>
      }

      <p class="mt-8 text-center text-sm text-text-muted">
        Paiement sécurisé par Stripe. Jobzz ne voit jamais ton numéro de carte.
        <a routerLink="/pourquoi-jobzz" class="text-accent hover:underline">En savoir plus</a>
      </p>
    </section>
  `,
})
export class TarifsComponent {
  private readonly billing = inject(BillingService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly pricing = PRICING;
  readonly stripeConfigured = signal(false);
  readonly launchSeats = signal<number | null>(null);
  readonly busy = signal<SubscriptionOffer | null>(null);
  readonly error = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const info = await this.billing.publicInfo();
      this.stripeConfigured.set(info.stripeConfigured);
      this.launchSeats.set(info.launchSeatsRemaining);
    } catch {
      // Pas d'info : on reste prudent, boutons désactivés.
      this.stripeConfigured.set(false);
    }
  }

  async subscribe(offer: SubscriptionOffer): Promise<void> {
    this.error.set(null);
    // Visiteur non connecté : on l'envoie d'abord créer son compte.
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/inscription'], { queryParams: { next: '/tarifs' } });
      return;
    }
    this.busy.set(offer);
    try {
      const { url } = await this.billing.checkout(offer);
      window.location.href = url;
    } catch (err: unknown) {
      this.busy.set(null);
      const message = (err as { error?: { message?: string } })?.error?.message;
      this.error.set(message ?? "Impossible d'ouvrir le paiement pour le moment.");
    }
  }
}
