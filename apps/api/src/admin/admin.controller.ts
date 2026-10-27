import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  FILES,
  TICKET_STATUSES,
  TICKET_TYPES,
  addTicketMessageSchema,
  adminDisableUserSchema,
  adminSetPlanSchema,
  updateTicketStatusSchema,
  type AddTicketMessageInput,
  type AdminDisableUserInput,
  type AdminHealth,
  type AdminSetPlanInput,
  type AdminStats,
  type AdminTicketSummary,
  type AdminUserList,
  type PublicTicket,
  type TicketStatus,
  type TicketType,
  type UpdateTicketStatusInput,
} from '@jobzz/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.guard';
import type { RequestUser } from '../auth/jwt-payload';
import { SupportService } from '../support/support.service';
import { AdminService } from './admin.service';

/** Espace admin (CLAUDE.md §4.11). Réservé au rôle `admin`, vérifié côté serveur. */
@Controller('admin')
@Roles('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly support: SupportService,
  ) {}

  // ─────────────────────────── Santé & stats ───────────────────────────

  @Get('health')
  health(): Promise<AdminHealth> {
    return this.admin.health();
  }

  @Post('automations/run')
  runAutomations(): { started: boolean } {
    return this.admin.runAutomationsNow();
  }

  @Get('stats')
  stats(): Promise<AdminStats> {
    return this.admin.stats();
  }

  // ─────────────────────────── Utilisateurs ───────────────────────────

  @Get('users')
  users(
    @Query('search') search = '',
    @Query('skip') skip = '0',
    @Query('take') take = '25',
  ): Promise<AdminUserList> {
    return this.admin.listUsers(search, Number(skip) || 0, Math.min(Number(take) || 25, 100));
  }

  @Post('users/:id/plan')
  setPlan(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminSetPlanSchema)) body: AdminSetPlanInput,
  ): Promise<void> {
    return this.admin.setPlan(id, body.plan);
  }

  @Post('users/:id/disabled')
  setDisabled(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminDisableUserSchema)) body: AdminDisableUserInput,
  ): Promise<void> {
    return this.admin.setDisabled(id, body.disabled);
  }

  // ─────────────────────────── Tickets ───────────────────────────

  @Get('tickets')
  tickets(
    @Query('status') status?: string,
    @Query('type') type?: string,
  ): Promise<AdminTicketSummary[]> {
    return this.support.listAllTickets({
      status: TICKET_STATUSES.includes(status as TicketStatus) ? (status as TicketStatus) : undefined,
      type: TICKET_TYPES.includes(type as TicketType) ? (type as TicketType) : undefined,
    });
  }

  @Get('tickets/:id')
  ticket(@Param('id') id: string): Promise<PublicTicket> {
    return this.support.getAnyTicket(id);
  }

  @Post('tickets/:id/reply')
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
    return this.support.addMessageAsAdmin(user.id, id, body.body, file);
  }

  @Post('tickets/:id/status')
  setStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTicketStatusSchema)) body: UpdateTicketStatusInput,
  ): Promise<PublicTicket> {
    return this.support.updateStatus(id, body.status);
  }
}
