import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  FILES,
  type CvOfferComparisonResult,
  type CvProfileExtract,
  type CvStatus,
} from '@jobzz/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/jwt-payload';
import { CvService } from './cv.service';

/** CV de l'utilisateur connecté (CLAUDE.md §4.8). Le fichier reste en mémoire, jamais sur disque. */
@Controller('cv')
export class CvController {
  constructor(private readonly cv: CvService) {}

  @Get()
  status(@CurrentUser() user: RequestUser): Promise<CvStatus> {
    return this.cv.status(user.id);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: FILES.cvMaxBytes },
    }),
  )
  upload(
    @CurrentUser() user: RequestUser,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CvStatus> {
    return this.cv.upload({ id: user.id, plan: user.plan, role: user.role }, file);
  }

  @Post('analyze-ai')
  analyzeAi(@CurrentUser() user: RequestUser): Promise<CvStatus> {
    return this.cv.analyzeAi({ id: user.id, plan: user.plan, role: user.role });
  }

  @Post('extract-profile')
  extractProfile(@CurrentUser() user: RequestUser): Promise<CvProfileExtract> {
    return this.cv.extractProfile({ id: user.id, plan: user.plan, role: user.role });
  }

  @Post('compare/:offerId')
  compare(
    @CurrentUser() user: RequestUser,
    @Param('offerId') offerId: string,
  ): Promise<CvOfferComparisonResult> {
    return this.cv.compare({ id: user.id, plan: user.plan, role: user.role }, offerId);
  }

  @Post('compare/:offerId/ai')
  compareAi(
    @CurrentUser() user: RequestUser,
    @Param('offerId') offerId: string,
  ): Promise<CvOfferComparisonResult> {
    return this.cv.compareAi({ id: user.id, plan: user.plan, role: user.role }, offerId);
  }

  @Delete()
  @HttpCode(204)
  async remove(@CurrentUser() user: RequestUser): Promise<void> {
    await this.cv.remove(user.id);
  }
}
