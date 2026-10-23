import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { BillingOverview, SubscriptionInfo, SubscriptionOffer } from '@jobzz/shared';

const API = '/api/billing';

/** Paiement Stripe (CLAUDE.md §2.1) côté front. Le paiement se fait sur les pages Stripe. */
@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly http = inject(HttpClient);

  /** Infos publiques (places de lancement, Stripe configuré…) sans être connecté. */
  publicInfo(): Promise<Omit<BillingOverview, 'plan' | 'premiumUntil' | 'isPremium'>> {
    return firstValueFrom(
      this.http.get<Omit<BillingOverview, 'plan' | 'premiumUntil' | 'isPremium'>>(`${API}/public`),
    );
  }

  overview(): Promise<BillingOverview> {
    return firstValueFrom(this.http.get<BillingOverview>(`${API}/overview`));
  }

  subscription(): Promise<SubscriptionInfo> {
    return firstValueFrom(this.http.get<SubscriptionInfo>(`${API}/subscription`));
  }

  /** Crée une session Stripe Checkout et renvoie l'URL de paiement (page Stripe). */
  checkout(offer: SubscriptionOffer): Promise<{ url: string }> {
    return firstValueFrom(this.http.post<{ url: string }>(`${API}/checkout`, { offer }));
  }

  /** Ouvre le portail client Stripe (changer de carte, factures, résilier). */
  portal(): Promise<{ url: string }> {
    return firstValueFrom(this.http.post<{ url: string }>(`${API}/portal`, {}));
  }
}
