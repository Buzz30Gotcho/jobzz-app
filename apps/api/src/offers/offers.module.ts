import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module';
import { ApplicationsModule } from '../applications/applications.module';
import { SourcesModule } from '../sources/sources.module';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';

/** Recherche manuelle d'offres (CLAUDE.md §4.5). EntitlementsService est fourni globalement. */
@Module({
  imports: [ProfileModule, ApplicationsModule, SourcesModule],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}
