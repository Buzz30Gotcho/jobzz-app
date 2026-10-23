import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BILLING_OFFERS, type BillingOverview, type SubscriptionInfo } from '@jobzz/shared';
import { BillingService } from '../../../core/billing/billing.service';

/**
 * « Mon abonnement » (Profil → Paramètres, CLAUDE.md §2.1) : offre actuelle, date de
 * renouvellement ou de fin, et bouton vers le portail client Stripe.
 */
@Component({
  selector: 'jz-abonnement',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-2xl px-4 py-10">
      <h1 class="text-2xl font-bold">Mon abonnement</h1>

      @if (loading()) {
        <div class="jz-card mt-6 h-32 animate-pulse"></div>
      } @else if (overview()?.isPremium) {
        <div class="jz-card mt-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-text-secondary">Offre actuelle</p>
              <p class="mt-1 text-lg font-semibold">{{ offerLabel() }}</p>
            </div>
            <span class="rounded-full bg-accent-bg px-3 py-1 font-mono text-sm text-accent">Premium</span>
          </div>

          @if (subscription()?.renewsOrEndsAt) {
            <p class="mt-4 text-sm text-text-secondary">
              {{ subscription()?.recurring ? 'Prochain renouvellement' : 'Premium actif jusqu’au' }}
              : <span class="font-mono">{{ formatDate(subscription()!.renewsOrEndsAt!) }}</span>
            </p>
          }

          @if (subscription()?.canManage) {
            <button type="button" class="jz-btn-primary mt-6" [disabled]="busy()" (click)="manage()">
              {{ busy() ? 'Ouverture…' : 'Gérer mon abonnement' }}
            </button>
            <p class="mt-2 text-xs text-text-muted">
              Change de carte, télécharge tes factures ou résilie en un clic sur Stripe.
            </p>
          } @else if (!subscription()?.recurring) {
            <p class="mt-6 text-sm text-text-secondary">
              Le Pass 3 mois ne se renouvelle pas automatiquement. Tu pourras reprendre un Premium à
              la fin.
            </p>
          }
        </div>
      } @else {
        <div class="jz-card mt-6 text-center">
          <p class="text-text-secondary">Tu es en offre gratuite.</p>
          <a routerLink="/tarifs" class="jz-btn-primary mt-4">Voir les offres Premium</a>
        </div>
      }

      @if (error()) {
        <p class="mt-4 text-sm text-danger">{{ error() }}</p>
      }

      <a routerLink="/app/profil/parametres" class="mt-8 inline-block text-sm text-text-muted hover:text-text">
        ← Retour aux paramètres
      </a>
    </section>
  `,
})
export class AbonnementComponent {
  private readonly billing = inject(BillingService);

  readonly overview = signal<BillingOverview | null>(null);
  readonly subscription = signal<SubscriptionInfo | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  offerLabel(): string {
    const offer = this.subscription()?.offer;
    return offer ? BILLING_OFFERS[offer].label : 'Premium';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  private async load(): Promise<void> {
    try {
      const [overview, subscription] = await Promise.all([
        this.billing.overview(),
        this.billing.subscription(),
      ]);
      this.overview.set(overview);
      this.subscription.set(subscription);
    } catch {
      this.error.set('Impossible de charger ton abonnement.');
    } finally {
      this.loading.set(false);
    }
  }

  async manage(): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      const { url } = await this.billing.portal();
      window.location.href = url;
    } catch (err: unknown) {
      this.busy.set(false);
      const message = (err as { error?: { message?: string } })?.error?.message;
      this.error.set(message ?? "Impossible d'ouvrir le portail Stripe.");
    }
  }
}
