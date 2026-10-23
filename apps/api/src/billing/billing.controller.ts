import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import {
  SUBSCRIPTION_OFFERS,
  type BillingOverview,
  type SubscriptionInfo,
  type SubscriptionOffer,
} from '@jobzz/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import type { RequestUser } from '../auth/jwt-payload';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';

const checkoutSchema = z.object({ offer: z.enum(SUBSCRIPTION_OFFERS) });

@Controller()
export class BillingController {
  constructor(
    private readonly billing: BillingService,
    private readonly stripe: StripeService,
  ) {}

  @Public()
  @Get('billing/public')
  publicInfo() {
    return this.billing.publicInfo();
  }

  @Get('billing/overview')
  overview(@CurrentUser() user: RequestUser): Promise<BillingOverview> {
    return this.billing.overview(user.id);
  }

  @Get('billing/subscription')
  subscription(@CurrentUser() user: RequestUser): Promise<SubscriptionInfo> {
    return this.billing.subscriptionInfo(user.id);
  }

  @Post('billing/checkout')
  @HttpCode(200)
  checkout(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(checkoutSchema)) body: { offer: SubscriptionOffer },
  ): Promise<{ url: string }> {
    return this.billing.createCheckout(user.id, user.email, body.offer);
  }

  @Post('billing/portal')
  @HttpCode(200)
  portal(@CurrentUser() user: RequestUser): Promise<{ url: string }> {
    return this.billing.createPortal(user.id);
  }

  /**
   * Webhook Stripe — **source de vérité** (CLAUDE.md §2.1). Signature vérifiée sur le corps brut,
   * traitement idempotent. Route publique (appelée par Stripe, pas par un utilisateur connecté).
   */
  @Public()
  @Post('webhooks/stripe')
  @HttpCode(200)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() _body: unknown,
  ): Promise<{ received: boolean }> {
    const signature = req.headers['stripe-signature'];
    if (!req.rawBody || typeof signature !== 'string') {
      throw new BadRequestException('Requête webhook invalide.');
    }
    let event;
    try {
      event = this.stripe.constructEvent(req.rawBody, signature);
    } catch (err) {
      throw new BadRequestException(`Signature Stripe invalide : ${(err as Error).message}`);
    }
    await this.billing.handleEvent(event);
    return { received: true };
  }
}
