import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module';
import { SourcesModule } from '../sources/sources.module';
import { AutomationsController } from './automations.controller';
import { AutomationsService } from './automations.service';

/** Automatisations (CLAUDE.md §4.6). EntitlementsService est fourni globalement. */
@Module({
  imports: [ProfileModule, SourcesModule],
  controllers: [AutomationsController],
  providers: [AutomationsService],
  exports: [AutomationsService],
})
export class AutomationsModule {}
