import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query, UsePipes } from '@nestjs/common';
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
import type { RequestUser } from '../auth/jwt-payload';
import { AutomationsService } from './automations.service';

const statusSchema = z.object({ status: z.enum(['active', 'en_pause']) });

@Controller('automations')
export class AutomationsController {
  constructor(private readonly automations: AutomationsService) {}

  private subject(user: RequestUser) {
    return { id: user.id, plan: user.plan, role: user.role };
  }

  @Get()
  list(@CurrentUser() user: RequestUser): Promise<PublicAutomation[]> {
    return this.automations.list(user.id);
  }

  @Post('preview')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(automationCriteriaSchema))
  preview(@Body() criteria: AutomationCriteria): Promise<AutomationPreview> {
    return this.automations.preview(criteria);
  }

  @Get('alert-helpers')
  alertHelpers(
    @CurrentUser() user: RequestUser,
    @Query('automationId') automationId?: string,
  ): Promise<AlertSuggestion[]> {
    return this.automations.alertHelpers(user.id, automationId);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(automationInputSchema))
  create(@CurrentUser() user: RequestUser, @Body() body: AutomationInput): Promise<PublicAutomation> {
    return this.automations.create(this.subject(user), body);
  }

  @Get(':id')
  getOne(@CurrentUser() user: RequestUser, @Param('id') id: string): Promise<PublicAutomation> {
    return this.automations.get(user.id, id);
  }

  @Put(':id')
  @UsePipes(new ZodValidationPipe(automationInputSchema))
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: AutomationInput,
  ): Promise<PublicAutomation> {
    return this.automations.update(user.id, id, body);
  }

  @Post(':id/status')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(statusSchema))
  setStatus(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: { status: 'active' | 'en_pause' },
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
