import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Ticket, TicketMessage } from '@prisma/client';
import {
  FILES,
  type AdminTicketSummary,
  type CreateTicketInput,
  type FaqEntry,
  type PublicTicket,
  type TicketStatus,
  type TicketSummary,
  type TicketType,
} from '@jobzz/shared';
import { PrismaService } from '../prisma/prisma.service';
import { MailSender } from '../mail/mail.service';
import { ticketCreatedAdminMail, ticketRepliedUserMail } from '../mail/templates';
import { AppConfigService } from '../config/app-config.service';
import { detectImageMime, extensionForMime } from './attachment';
import { loadFaq } from './faq';

type TicketWithMessages = Ticket & { messages: TicketMessage[] };

/** Dossier des pièces jointes, **hors** de tout dossier servi publiquement (CLAUDE.md §9). */
const ATTACHMENTS_DIR = resolve(process.cwd(), 'storage', 'support');

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailSender,
    private readonly config: AppConfigService,
  ) {}

  faq(): FaqEntry[] {
    return loadFaq();
  }

  // ─────────────────────────── Côté utilisateur ───────────────────────────

  async createTicket(
    user: { id: string },
    input: CreateTicketInput,
    file?: Express.Multer.File,
  ): Promise<PublicTicket> {
    const attachmentPath = file ? await this.storeAttachment(file) : null;
    const ticket = await this.prisma.ticket.create({
      data: {
        userId: user.id,
        type: input.type,
        subject: input.subject,
        status: 'ouvert',
        messages: {
          create: { authorId: user.id, body: input.message, attachmentPath },
        },
      },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    await this.notifyAdminOfNewTicket(ticket);
    return this.toPublicTicket(ticket);
  }

  async listMine(userId: string): Promise<TicketSummary[]> {
    const tickets = await this.prisma.ticket.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { messages: true } } },
    });
    return tickets.map((t) => ({
      id: t.id,
      type: t.type as TicketType,
      subject: t.subject,
      status: t.status as TicketStatus,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      messageCount: t._count.messages,
    }));
  }

  async getForUser(userId: string, ticketId: string): Promise<PublicTicket> {
    const ticket = await this.loadTicket(ticketId);
    if (ticket.userId !== userId) {
      throw new NotFoundException('Ticket introuvable.');
    }
    return this.toPublicTicket(ticket);
  }

  /** Réponse de l'utilisateur sur son propre ticket (ownership vérifié). */
  async addMessageAsUser(
    userId: string,
    ticketId: string,
    body: string,
    file?: Express.Multer.File,
  ): Promise<PublicTicket> {
    const ticket = await this.loadTicket(ticketId);
    if (ticket.userId !== userId) {
      throw new NotFoundException('Ticket introuvable.');
    }
    return this.addMessage(ticketId, userId, body, file, false);
  }

  /** Réponse de l'équipe (admin) : déclenche le mail à l'utilisateur. */
  async addMessageAsAdmin(
    adminId: string,
    ticketId: string,
    body: string,
    file?: Express.Multer.File,
  ): Promise<PublicTicket> {
    await this.loadTicket(ticketId);
    return this.addMessage(ticketId, adminId, body, file, true);
  }

  /** Ajoute un message. `isAdminReply` déclenche le mail à l'utilisateur. */
  private async addMessage(
    ticketId: string,
    authorId: string,
    body: string,
    file: Express.Multer.File | undefined,
    isAdminReply: boolean,
  ): Promise<PublicTicket> {
    const attachmentPath = file ? await this.storeAttachment(file) : null;
    await this.prisma.ticketMessage.create({
      data: { ticketId, authorId, body, attachmentPath },
    });
    // `updatedAt` du ticket remonte pour le tri.
    const ticket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (isAdminReply) {
      await this.notifyUserOfReply(ticket);
    }
    return this.toPublicTicket(ticket);
  }

  // ─────────────────────────── Côté admin ───────────────────────────

  async listAllTickets(filter: { status?: TicketStatus; type?: TicketType }): Promise<AdminTicketSummary[]> {
    const tickets = await this.prisma.ticket.findMany({
      where: { status: filter.status, type: filter.type },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { messages: true } }, user: { select: { email: true } } },
    });
    return tickets.map((t) => ({
      id: t.id,
      type: t.type as TicketType,
      subject: t.subject,
      status: t.status as TicketStatus,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      messageCount: t._count.messages,
      userEmail: t.user.email,
    }));
  }

  async getAnyTicket(ticketId: string): Promise<PublicTicket> {
    return this.toPublicTicket(await this.loadTicket(ticketId));
  }

  async updateStatus(ticketId: string, status: TicketStatus): Promise<PublicTicket> {
    const ticket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    return this.toPublicTicket(ticket);
  }

  // ─────────────────────────── Pièces jointes ───────────────────────────

  /** Renvoie le chemin absolu + le type d'une pièce jointe, après contrôle d'accès. */
  async resolveAttachment(
    requester: { id: string; role: string },
    messageId: string,
  ): Promise<{ absolutePath: string; mime: string }> {
    const message = await this.prisma.ticketMessage.findUnique({
      where: { id: messageId },
      include: { ticket: true },
    });
    if (!message || !message.attachmentPath) {
      throw new NotFoundException('Pièce jointe introuvable.');
    }
    // Accessible uniquement à l'auteur du ticket et à l'admin.
    if (requester.role !== 'admin' && message.ticket.userId !== requester.id) {
      throw new ForbiddenException('Accès refusé.');
    }
    const ext = message.attachmentPath.split('.').pop() ?? 'bin';
    const mime =
      ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    return { absolutePath: join(ATTACHMENTS_DIR, message.attachmentPath), mime };
  }

  private async storeAttachment(file: Express.Multer.File): Promise<string> {
    if (file.size > FILES.ticketAttachmentMaxBytes) {
      throw new BadRequestException('Pièce jointe trop volumineuse (2 Mo maximum).');
    }
    const mime = detectImageMime(file.buffer);
    if (!mime) {
      throw new BadRequestException('La pièce jointe doit être une image PNG, JPEG ou WebP.');
    }
    if (!existsSync(ATTACHMENTS_DIR)) {
      mkdirSync(ATTACHMENTS_DIR, { recursive: true });
    }
    // Nom aléatoire : jamais le nom d'origine fourni par l'utilisateur (§9).
    const filename = `${randomUUID()}.${extensionForMime(mime)}`;
    await writeFile(join(ATTACHMENTS_DIR, filename), file.buffer);
    return filename;
  }

  // ─────────────────────────── Helpers ───────────────────────────

  private loadTicket(ticketId: string): Promise<TicketWithMessages> {
    return this.prisma.ticket
      .findUniqueOrThrow({
        where: { id: ticketId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      })
      .catch(() => {
        throw new NotFoundException('Ticket introuvable.');
      });
  }

  private toPublicTicket(ticket: TicketWithMessages): PublicTicket {
    return {
      id: ticket.id,
      type: ticket.type as TicketType,
      subject: ticket.subject,
      status: ticket.status as TicketStatus,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      messages: ticket.messages.map((m) => ({
        id: m.id,
        body: m.body,
        // Un message « de l'équipe » est un message dont l'auteur n'est pas le propriétaire du ticket.
        fromAdmin: m.authorId !== ticket.userId,
        hasAttachment: m.attachmentPath !== null,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  private async notifyAdminOfNewTicket(ticket: Ticket): Promise<void> {
    const adminEmail = this.config.get('ADMIN_EMAIL');
    if (!adminEmail) return;
    const url = `${this.config.get('APP_URL')}/admin/tickets/${ticket.id}`;
    try {
      await this.mail.send(
        ticketCreatedAdminMail(this.config.get('APP_NAME'), adminEmail, ticket.type, ticket.subject, url),
      );
    } catch (error) {
      this.logger.warn(`Mail admin (nouveau ticket) non envoyé : ${String(error)}`);
    }
  }

  private async notifyUserOfReply(ticket: Ticket): Promise<void> {
    const owner = await this.prisma.user.findUnique({
      where: { id: ticket.userId },
      select: { email: true },
    });
    if (!owner) return;
    const url = `${this.config.get('APP_URL')}/app/aide/demandes`;
    try {
      await this.mail.send(
        ticketRepliedUserMail(this.config.get('APP_NAME'), owner.email, ticket.subject, url),
      );
    } catch (error) {
      this.logger.warn(`Mail utilisateur (réponse ticket) non envoyé : ${String(error)}`);
    }
  }
}
