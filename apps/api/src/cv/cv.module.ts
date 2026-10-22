import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { CvController } from './cv.controller';
import { CvService } from './cv.service';

/** CV : dépôt, analyses (règles + IA), comparaison (CLAUDE.md §4.8). Prisma/Entitlements globaux. */
@Module({
  imports: [AiModule],
  controllers: [CvController],
  providers: [CvService],
  exports: [CvService],
})
export class CvModule {}
