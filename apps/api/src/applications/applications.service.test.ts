import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service';
import type { EntitlementsService } from '../entitlements/entitlements.service';
import type { UsersService } from '../users/users.service';
import type { AiMessagesService } from '../ai/ai-messages.service';
import { ApplicationsService } from './applications.service';

function makeService(prismaOverrides: Record<string, unknown>) {
  const prisma = prismaOverrides as unknown as PrismaService;
  const entitlements = { consume: vi.fn().mockResolvedValue(undefined) } as unknown as EntitlementsService;
  const users = { firstName: vi.fn().mockResolvedValue(null) } as unknown as UsersService;
  const aiMessages = { generate: vi.fn() } as unknown as AiMessagesService;
  return new ApplicationsService(prisma, entitlements, users, aiMessages);
}

const baseRow = {
  id: 'a1',
  companyName: 'Acme',
  position: 'Dev',
  contactEmail: 'rh@acme.fr',
  contactName: null,
  appliedAt: new Date('2026-10-06T00:00:00Z'),
  source: 'offer',
  offerUrl: null,
  status: 'en_attente',
  responseType: null,
  archivedAt: null,
  followUpCount: 0,
  lastFollowUpAt: null,
  nextFollowUpAt: new Date('2026-10-13T00:00:00Z'),
  respondedAt: null,
  followUps: [],
};

describe('ApplicationsService.createFromOffer', () => {
  it('signale un doublon au lieu de recréer', async () => {
    const service = makeService({
      application: { findFirst: vi.fn().mockResolvedValue(baseRow), create: vi.fn() },
    });
    const { duplicate, application } = await service.createFromOffer('u1', {
      companyName: 'Acme SAS',
      position: 'Dev',
    });
    expect(duplicate).toBe(true);
    expect(application.id).toBe('a1');
  });

  it('crée la candidature quand il n\'y a pas de doublon', async () => {
    const create = vi.fn().mockResolvedValue(baseRow);
    const service = makeService({
      application: { findFirst: vi.fn().mockResolvedValue(null), create },
    });
    const { duplicate } = await service.createFromOffer('u1', { companyName: 'Acme', position: 'Dev' });
    expect(duplicate).toBe(false);
    expect(create).toHaveBeenCalledOnce();
    // La clé de doublon normalisée est bien calculée (sans forme juridique).
    expect(create.mock.calls[0][0].data.companyKey).toBe('acme');
  });
});

describe('ApplicationsService.recordFollowUp', () => {
  it('une relance fait passer la candidature en « relancee » et la sort des buzz', async () => {
    const update = vi.fn().mockResolvedValue(baseRow);
    const service = makeService({
      application: {
        findFirst: vi.fn().mockResolvedValue(baseRow),
        update,
        findUniqueOrThrow: vi.fn().mockResolvedValue({ ...baseRow, status: 'relancee', nextFollowUpAt: null }),
      },
      followUp: { create: vi.fn().mockResolvedValue({}) },
    });

    const result = await service.recordFollowUp('u1', 'a1', {
      kind: 'relance',
      channel: 'gmail',
      body: 'Bonjour',
      aiGenerated: false,
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'relancee', nextFollowUpAt: null }) }),
    );
    expect(result.status).toBe('relancee');
  });
});
