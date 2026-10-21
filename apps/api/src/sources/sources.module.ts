import { Module } from '@nestjs/common';
import { DemoSource } from './demo.source';
import { FranceTravailSource } from './france-travail.source';
import { LaBonneAlternanceSource } from './la-bonne-alternance.source';
import { AdzunaSource } from './adzuna.source';
import { SourcesService } from './sources.service';

/** Connecteurs de sources d'offres (CLAUDE.md §4.4). */
@Module({
  providers: [DemoSource, FranceTravailSource, LaBonneAlternanceSource, AdzunaSource, SourcesService],
  exports: [SourcesService],
})
export class SourcesModule {}
