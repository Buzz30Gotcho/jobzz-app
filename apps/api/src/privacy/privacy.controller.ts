import { Body, Controller, Get, HttpCode, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
// `archiver` est un module CommonJS exporté en `export =` : l'import `= require` est la
// forme TypeScript correcte sans `esModuleInterop` (règle lint désactivée pour cette ligne).
// eslint-disable-next-line @typescript-eslint/no-require-imports
import archiver = require('archiver');
import { deleteAccountSchema, type DeleteAccountInput } from '@jobzz/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/jwt-payload';
import { AppConfigService } from '../config/app-config.service';
import { PrivacyService } from './privacy.service';

const REFRESH_COOKIE = 'jobzz_refresh';

/** « Mes données » (CLAUDE.md §4.12) : chacun n'exporte et ne supprime que son propre compte. */
@Controller('privacy')
export class PrivacyController {
  constructor(
    private readonly privacy: PrivacyService,
    private readonly config: AppConfigService,
  ) {}

  /** Télécharge un ZIP contenant un JSON par type de données. */
  @Get('export')
  async export(@CurrentUser() user: RequestUser, @Res() res: Response): Promise<void> {
    const files = await this.privacy.collectExport(user.id);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="jobzz-mes-donnees.zip"');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);
    for (const file of files) {
      archive.append(JSON.stringify(file.content, null, 2), { name: file.name });
    }
    await archive.finalize();
  }

  /** Suppression définitive du compte (confirmation par ré-saisie de l'email). */
  @Post('delete-account')
  @HttpCode(204)
  async deleteAccount(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(deleteAccountSchema)) body: DeleteAccountInput,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.privacy.deleteAccount(user.id, body.confirmEmail);
    res.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: 'lax',
      path: '/',
    });
  }
}
