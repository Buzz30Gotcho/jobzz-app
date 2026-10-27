import { Body, Controller, Param, Post } from '@nestjs/common';
import {
  createJobOutcomeSchema,
  type CreateJobOutcomeInput,
  type PublicJobOutcome,
} from '@jobzz/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/jwt-payload';
import { OutcomesService } from './outcomes.service';

/** « J'ai trouvé ! » (CLAUDE.md §4.9). Chacun n'agit que sur ses propres événements. */
@Controller('outcomes')
export class OutcomesController {
  constructor(private readonly outcomes: OutcomesService) {}

  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createJobOutcomeSchema)) body: CreateJobOutcomeInput,
  ): Promise<PublicJobOutcome> {
    return this.outcomes.create(user.id, body);
  }

  @Post('pause-automations')
  pauseAutomations(@CurrentUser() user: RequestUser): Promise<{ paused: number }> {
    return this.outcomes.pauseAllAutomations(user.id);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: RequestUser, @Param('id') id: string): Promise<PublicJobOutcome> {
    return this.outcomes.cancel(user.id, id);
  }
}
