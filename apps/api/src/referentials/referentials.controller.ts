import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { referentialQuerySchema, type Commune, type RomeJob } from '@jobzz/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { GeoService } from './geo.service';
import { RomeService } from './rome.service';

/**
 * Référentiels pour l'autocomplétion du profil et des automatisations (authentifié).
 * Communes : geo.api.gouv.fr. Métiers : ROME (France Travail) ou saisie libre si non configuré.
 */
@Controller('referentials')
export class ReferentialsController {
  constructor(
    private readonly geo: GeoService,
    private readonly rome: RomeService,
  ) {}

  @Get('communes')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  communes(
    @Query(new ZodValidationPipe(referentialQuerySchema)) query: { q: string },
  ): Promise<Commune[]> {
    return this.geo.searchCommunes(query.q);
  }

  @Get('metiers')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  metiers(
    @Query(new ZodValidationPipe(referentialQuerySchema)) query: { q: string },
  ): Promise<RomeJob[]> {
    return this.rome.searchMetiers(query.q);
  }
}
