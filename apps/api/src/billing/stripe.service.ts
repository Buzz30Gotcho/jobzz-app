import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import type { CheckoutMode, SubscriptionOffer } from '@jobzz/shared';
import { AppConfigService } from '../config/app-config.service';

export interface CheckoutParams {
  offer: SubscriptionOffer;
  mode: CheckoutMode;
  priceId: string;
  customerId: string;
  successUrl: string;
  cancelUrl: string;
  clientReferenceId: string;
}

/**
 * Enveloppe le SDK Stripe (CLAUDE.md §2.1, §7). Jobzz ne voit jamais de numéro de carte :
 * tout se passe sur Stripe Checkout et le portail client. Le client est **paresseux** : s'il
 * n'y a pas de clé configurée (`STRIPE_SECRET_KEY` vide), les boutons de paiement affichent
 * « Paiement non configuré » et le reste de l'app fonctionne normalement.
 */
@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private client: Stripe | null = null;

  constructor(private readonly config: AppConfigService) {}

  /** Stripe est-il configuré (clé secrète présente) ? */
  get configured(): boolean {
    return this.config.get('STRIPE_SECRET_KEY').length > 0;
  }

  private get stripe(): Stripe {
    if (!this.configured) {
      throw new Error('Stripe n’est pas configuré (STRIPE_SECRET_KEY manquante).');
    }
    if (!this.client) {
      this.client = new Stripe(this.config.get('STRIPE_SECRET_KEY'));
    }
    return this.client;
  }

  /** Identifiant de prix Stripe pour une offre, depuis la configuration. */
  priceIdFor(offer: SubscriptionOffer): string {
    const map: Record<SubscriptionOffer, string> = {
      monthly: this.config.get('STRIPE_PRICE_MONTHLY'),
      launch: this.config.get('STRIPE_PRICE_LAUNCH'),
      pass_3_months: this.config.get('STRIPE_PRICE_PASS_3_MONTHS'),
    };
    return map[offer];
  }

  /** Crée (ou réutilise) le client Stripe lié à cet utilisateur Jobzz. */
  async ensureCustomer(
    existingCustomerId: string | null,
    email: string,
    userId: string,
  ): Promise<string> {
    if (existingCustomerId) return existingCustomerId;
    const customer = await this.stripe.customers.create({
      email,
      metadata: { userId },
    });
    return customer.id;
  }

  /** Session Stripe Checkout (abonnement ou paiement unique). */
  async createCheckoutSession(params: CheckoutParams): Promise<string> {
    const session = await this.stripe.checkout.sessions.create({
      mode: params.mode,
      customer: params.customerId,
      client_reference_id: params.clientReferenceId,
      line_items: [{ price: params.priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      allow_promotion_codes: false,
      metadata: { offer: params.offer, userId: params.clientReferenceId },
      // Le mode `payment` (Pass) a besoin d'un rattachement explicite des métadonnées au paiement.
      ...(params.mode === 'payment'
        ? { payment_intent_data: { metadata: { offer: params.offer, userId: params.clientReferenceId } } }
        : { subscription_data: { metadata: { offer: params.offer, userId: params.clientReferenceId } } }),
    });
    if (!session.url) {
      throw new Error('Stripe n’a pas renvoyé d’URL de paiement.');
    }
    return session.url;
  }

  /** Session du portail client Stripe (changer de carte, factures, résiliation). */
  async createPortalSession(customerId: string, returnUrl: string): Promise<string> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return session.url;
  }

  /** Vérifie la signature du webhook et renvoie l'événement typé. Lève si la signature est invalide. */
  constructEvent(rawBody: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.config.get('STRIPE_WEBHOOK_SECRET'),
    );
  }

  /** Récupère un abonnement (pour lire sa date de fin de période). */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.retrieve(subscriptionId);
  }
}
