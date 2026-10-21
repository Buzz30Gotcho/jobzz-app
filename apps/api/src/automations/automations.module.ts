import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module';
import { SourcesModule } from '../sources/sources.module';
import { OffersModule } from '../offers/offers.module';
import { UsersModule } from '../users/users.module';
import { AutomationsController } from './automations.controller';
import { AutomationsService } from './automations.service';
import { AutomationRunnerService } from './automation-runner.service';
import { QueueService } from './queue.service';

/** Automatisations (CLAUDE.md §4.6). EntitlementsService et MailSender sont fournis globalement. */
@Module({
  imports: [ProfileModule, SourcesModule, OffersModule, UsersModule],
  controllers: [AutomationsController],
  providers: [AutomationsService, AutomationRunnerService, QueueService],
  exports: [AutomationsService, AutomationRunnerService],
})
export class AutomationsModule {}
