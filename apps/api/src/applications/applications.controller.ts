import { Body, Controller, Get, Param, Patch, Post, Query, UsePipes } from '@nestjs/common';
import {
  createFromOfferSchema,
  freeSendSchema,
  listApplicationsSchema,
  recordFollowUpSchema,
  respondSchema,
  type CreateFromOfferInput,
  type DashboardSummary,
  type FreeSendInput,
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
  @UsePipes(new ZodValidationPipe(createFromOfferSchema))
  createFromOffer(
    @CurrentUser() user: RequestUser,
    @Body() body: CreateFromOfferInput,
  ): Promise<{ application: PublicApplication; duplicate: boolean }> {
    return this.applications.createFromOffer(user.id, body);
  }

  @Post('free-send')
  @UsePipes(new ZodValidationPipe(freeSendSchema))
  freeSend(@CurrentUser() user: RequestUser, @Body() body: FreeSendInput): Promise<PublicApplication> {
    return this.applications.freeSend({ id: user.id, plan: user.plan, role: user.role }, body);
  }

  @Post(':id/follow-ups')
  @UsePipes(new ZodValidationPipe(recordFollowUpSchema))
  recordFollowUp(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: RecordFollowUpInput,
  ): Promise<PublicApplication> {
    return this.applications.recordFollowUp(user.id, id, body);
  }

  @Post(':id/respond')
  @UsePipes(new ZodValidationPipe(respondSchema))
  respond(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: RespondInput,
  ): Promise<PublicApplication> {
    return this.applications.respond(user.id, id, body.responseType);
  }

  @Patch(':id/archive')
  archive(@CurrentUser() user: RequestUser, @Param('id') id: string): Promise<PublicApplication> {
    return this.applications.archive(user.id, id);
  }
}
