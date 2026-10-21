import { Body, Controller, Get, Post, UsePipes } from '@nestjs/common';
import { aiFreeMessageSchema, type AiFreeMessageInput, type GeneratedMessage } from '@jobzz/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/jwt-payload';
import { AiService } from './ai.service';
import { AiMessagesService } from './ai-messages.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly ai: AiService,
    private readonly messages: AiMessagesService,
  ) {}

  /** Disponibilité de l'IA (pour afficher ou non le bouton « Rédiger avec l'IA »). */
  @Get('status')
  status(): { available: boolean } {
    return { available: this.ai.isAvailable() };
  }

  /** Rédige un message d'envoi libre (candidature spontanée, remerciement). */
  @Post('free-message')
  @UsePipes(new ZodValidationPipe(aiFreeMessageSchema))
  freeMessage(
    @CurrentUser() user: RequestUser,
    @Body() body: AiFreeMessageInput,
  ): Promise<GeneratedMessage> {
    return this.messages.generate(
      { id: user.id, plan: user.plan, role: user.role },
      {
        kind: body.type,
        entreprise: body.companyName,
        poste: body.position ?? 'le poste',
      },
    );
  }
}
