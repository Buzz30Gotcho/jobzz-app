import { Module } from '@nestjs/common';
import { ReferentialsController } from './referentials.controller';
import { GeoService } from './geo.service';
import { RomeService } from './rome.service';

/** Référentiels externes mis en cache (communes, métiers ROME). */
@Module({
  controllers: [ReferentialsController],
  providers: [GeoService, RomeService],
  exports: [GeoService, RomeService],
})
export class ReferentialsModule {}
