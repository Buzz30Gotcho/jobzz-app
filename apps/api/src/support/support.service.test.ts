import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service';
import type { MailSender } from '../mail/mail.service';
import type { AppConfigService } from '../config/app-config.service';
import { SupportService } from './support.service';

function makeService(prismaOverrides: Record<string, unknown>) {
  const prisma = prismaOverrides as unknown as PrismaService;
  const mail = { send: vi.fn().mockResolvedValue(undefined) } as unknown as MailSender;
  const config = { get: () => 'x' } as unknown as AppConfigService;
  return new SupportService(prisma, mail, config);
}

const ticket = {
  id: 't1',
  userId: 'owner',
  type: 'question',
  subject: 'Sujet',
  status: 'ouvert',
  createdAt: new Date('2026-10-01T00:00:00Z'),
  updatedAt: new Date('2026-10-02T00:00:00Z'),
  messages: [
    { id: 'm1', authorId: 'owner', body: 'Bonjour', attachmentPath: null, createdAt: new Date('2026-10-01T00:00:00Z') },
    { id: 'm2', authorId: 'admin', body: 'Réponse', attachmentPath: 'abc.png', createdAt: new Date('2026-10-02T00:00:00Z') },
  ],
};

describe('SupportService.getForUser', () => {
  it("refuse l'accès au ticket d'un autre utilisateur", async () => {
    const service = makeService({
      ticket: { findUniqueOrThrow: vi.fn().mockResolvedValue(ticket) },
    });
    await expect(service.getForUser('intrus', 't1')).rejects.toThrow();
  });

  it('marque les messages de l’équipe (fromAdmin) et la présence de pièce jointe', async () => {
    const service = makeService({
      ticket: { findUniqueOrThrow: vi.fn().mockResolvedValue(ticket) },
    });
    const result = await service.getForUser('owner', 't1');
    expect(result.messages[0].fromAdmin).toBe(false);
    expect(result.messages[0].hasAttachment).toBe(false);
    expect(result.messages[1].fromAdmin).toBe(true);
    expect(result.messages[1].hasAttachment).toBe(true);
  });
});

describe('SupportService.resolveAttachment', () => {
  it("refuse une pièce jointe à un tiers non admin", async () => {
    const service = makeService({
      ticketMessage: {
        findUnique: vi.fn().mockResolvedValue({ attachmentPath: 'abc.png', ticket: { userId: 'owner' } }),
      },
    });
    await expect(
      service.resolveAttachment({ id: 'intrus', role: 'user' }, 'm2'),
    ).rejects.toThrow();
  });

  it("l'autorise à l'admin", async () => {
    const service = makeService({
      ticketMessage: {
        findUnique: vi.fn().mockResolvedValue({ attachmentPath: 'abc.png', ticket: { userId: 'owner' } }),
      },
    });
    const { mime } = await service.resolveAttachment({ id: 'x', role: 'admin' }, 'm2');
    expect(mime).toBe('image/png');
  });
});
