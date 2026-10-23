import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingScheduleService } from './billing-schedule.service';
import { StripeService } from './stripe.service';

/**
 * Paiement Stripe en mode test (CLAUDE.md §2.1). PrismaService, AppConfigService et MailSender
 * sont fournis globalement.
 */
@Module({
  controllers: [BillingController],
  providers: [BillingService, StripeService, BillingScheduleService],
  exports: [BillingService],
})
export class BillingModule {}
