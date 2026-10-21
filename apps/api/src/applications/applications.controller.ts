import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  createFromOfferSchema,
  freeSendSchema,
  listApplicationsSchema,
  recordFollowUpSchema,
  respondSchema,
  type CreateFromOfferInput,
  type DashboardSummary,
  type FreeSendInput,
  type GeneratedMessage,
  type ListApplicationsInput,
  type PublicApplication,
  type RecordFollowUpInput,
  type RespondInput,
} from '@jobzz/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/jwt-payload';
import { ApplicationsService } from './applications.service';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Get()
  list(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(listApplicationsSchema)) query: ListApplicationsInput,
  ): Promise<PublicApplication[]> {
    return this.applications.list(user.id, query.filter, query.search);
  }

  @Get('due')
  due(@CurrentUser() user: RequestUser): Promise<PublicApplication[]> {
    return this.applications.due(user.id);
  }

  @Get('dashboard')
  dashboard(@CurrentUser() user: RequestUser): Promise<DashboardSummary> {
    return this.applications.dashboard(user.id);
  }

  @Post('from-offer')
  createFromOffer(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createFromOfferSchema)) body: CreateFromOfferInput,
  ): Promise<{ application: PublicApplication; duplicate: boolean }> {
    return this.applications.createFromOffer(user.id, body);
  }

  @Post('free-send')
  freeSend(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(freeSendSchema)) body: FreeSendInput,
  ): Promise<PublicApplication> {
    return this.applications.freeSend({ id: user.id, plan: user.plan, role: user.role }, body);
  }

  @Post(':id/follow-ups')
  recordFollowUp(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(recordFollowUpSchema)) body: RecordFollowUpInput,
  ): Promise<PublicApplication> {
    return this.applications.recordFollowUp(user.id, id, body);
  }

  @Post(':id/ai-message')
  aiMessage(@CurrentUser() user: RequestUser, @Param('id') id: string): Promise<GeneratedMessage> {
    return this.applications.aiMessage({ id: user.id, plan: user.plan, role: user.role }, id);
  }

  @Post(':id/respond')
  respond(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(respondSchema)) body: RespondInput,
  ): Promise<PublicApplication> {
    return this.applications.respond(user.id, id, body.responseType);
  }

  @Patch(':id/archive')
  archive(@CurrentUser() user: RequestUser, @Param('id') id: string): Promise<PublicApplication> {
    return this.applications.archive(user.id, id);
  }
}
