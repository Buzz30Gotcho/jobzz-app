import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import {
  FILES,
  addTicketMessageSchema,
  createTicketSchema,
  type AddTicketMessageInput,
  type CreateTicketInput,
  type FaqEntry,
  type PublicTicket,
  type TicketSummary,
} from '@jobzz/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/jwt-payload';
import { SupportService } from './support.service';

/** Aide et tickets (CLAUDE.md §4.10). Chacun n'accède qu'à ses propres tickets. */
@Controller('support')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Get('faq')
  faq(): FaqEntry[] {
    return this.support.faq();
  }

  @Post('tickets')
  @UseInterceptors(
    FileInterceptor('screenshot', {
      storage: memoryStorage(),
      limits: { fileSize: FILES.ticketAttachmentMaxBytes },
    }),
  )
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createTicketSchema)) body: CreateTicketInput,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<PublicTicket> {
    return this.support.createTicket({ id: user.id }, body, file);
  }

  @Get('tickets')
  listMine(@CurrentUser() user: RequestUser): Promise<TicketSummary[]> {
    return this.support.listMine(user.id);
  }

  @Get('tickets/:id')
  getMine(@CurrentUser() user: RequestUser, @Param('id') id: string): Promise<PublicTicket> {
    return this.support.getForUser(user.id, id);
  }

  @Post('tickets/:id/messages')
  @UseInterceptors(
    FileInterceptor('screenshot', {
      storage: memoryStorage(),
      limits: { fileSize: FILES.ticketAttachmentMaxBytes },
    }),
  )
  reply(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addTicketMessageSchema)) body: AddTicketMessageInput,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<PublicTicket> {
    // Un utilisateur ne peut écrire que sur son propre ticket (vérifié dans le service).
    return this.support.addMessageAsUser(user.id, id, body.body, file);
  }

  /** Sert une pièce jointe (image) à l'auteur du ticket ou à l'admin uniquement. */
  @Get('attachments/:messageId')
  async attachment(
    @CurrentUser() user: RequestUser,
    @Param('messageId') messageId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { absolutePath, mime } = await this.support.resolveAttachment(
      { id: user.id, role: user.role },
      messageId,
    );
    res.type(mime);
    res.sendFile(absolutePath);
  }
}
