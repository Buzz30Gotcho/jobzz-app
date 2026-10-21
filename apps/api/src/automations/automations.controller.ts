import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { z } from 'zod';
import {
  automationCriteriaSchema,
  automationInputSchema,
  type AlertSuggestion,
  type AutomationCriteria,
  type AutomationInput,
  type AutomationPreview,
  type PublicAutomation,
} from '@jobzz/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import type { RequestUser } from '../auth/jwt-payload';
import { AppConfigService } from '../config/app-config.service';
import { AutomationsService } from './automations.service';
import { AutomationRunnerService, type RunSummary } from './automation-runner.service';
import { verifyUnsubscribeToken } from './unsubscribe-token';

const statusSchema = z.object({ status: z.enum(['active', 'en_pause']) });
const unsubscribeSchema = z.object({ token: z.string().trim().min(1).max(500) });

@Controller('automations')
export class AutomationsController {
  constructor(
    private readonly automations: AutomationsService,
    private readonly runner: AutomationRunnerService,
    private readonly config: AppConfigService,
  ) {}

  private subject(user: RequestUser) {
    return { id: user.id, plan: user.plan, role: user.role };
  }

  @Get()
  list(@CurrentUser() user: RequestUser): Promise<PublicAutomation[]> {
    return this.automations.list(user.id);
  }

  @Post('preview')
  @HttpCode(200)
  preview(
    @Body(new ZodValidationPipe(automationCriteriaSchema)) criteria: AutomationCriteria,
  ): Promise<AutomationPreview> {
    return this.automations.preview(criteria);
  }

  @Get('alert-helpers')
  alertHelpers(
    @CurrentUser() user: RequestUser,
    @Query('automationId') automationId?: string,
  ): Promise<AlertSuggestion[]> {
    return this.automations.alertHelpers(user.id, automationId);
  }

  @Post('run-mine')
  @HttpCode(200)
  runMine(@CurrentUser() user: RequestUser): Promise<RunSummary> {
    return this.runner.runForUser(user.id, { force: true });
  }

  @Public()
  @Post('unsubscribe')
  @HttpCode(204)
  async unsubscribe(@Body(new ZodValidationPipe(unsubscribeSchema)) body: { token: string }): Promise<void> {
    const userId = verifyUnsubscribeToken(body.token, this.config.get('REFRESH_TOKEN_SECRET'));
    if (userId) await this.runner.unsubscribe(userId);
  }

  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(automationInputSchema)) body: AutomationInput,
  ): Promise<PublicAutomation> {
    return this.automations.create(this.subject(user), body);
  }

  @Get(':id')
  getOne(@CurrentUser() user: RequestUser, @Param('id') id: string): Promise<PublicAutomation> {
    return this.automations.get(user.id, id);
  }

  @Put(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(automationInputSchema)) body: AutomationInput,
  ): Promise<PublicAutomation> {
    return this.automations.update(user.id, id, body);
  }

  @Post(':id/status')
  @HttpCode(200)
  setStatus(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(statusSchema)) body: { status: 'active' | 'en_pause' },
  ): Promise<PublicAutomation> {
    return this.automations.setStatus(this.subject(user), id, body.status);
  }

  @Post(':id/duplicate')
  @HttpCode(200)
  duplicate(@CurrentUser() user: RequestUser, @Param('id') id: string): Promise<PublicAutomation> {
    return this.automations.duplicate(this.subject(user), id);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string): Promise<void> {
    await this.automations.remove(user.id, id);
  }
}
