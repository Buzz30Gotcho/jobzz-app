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

describe('ApplicationsService.dashboard — carte « Bien démarrer »', () => {
  function makeDashboardService(opts: {
    counts: number;
    user: { firstSearchAt: Date | null; startChecklistDismissedAt: Date | null } | null;
    profile: Record<string, unknown> | null;
    automationCount: number;
    cvCount: number;
  }) {
    return makeService({
      application: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(opts.counts) },
      followUp: { count: vi.fn().mockResolvedValue(0) },
      user: { findUnique: vi.fn().mockResolvedValue(opts.user) },
      profile: { findUnique: vi.fn().mockResolvedValue(opts.profile) },
      automation: { count: vi.fn().mockResolvedValue(opts.automationCount) },
      cvDocument: { count: vi.fn().mockResolvedValue(opts.cvCount) },
    });
  }

  it('nouvel utilisateur : toutes les étapes à faire', async () => {
    const service = makeDashboardService({
      counts: 0,
      user: { firstSearchAt: null, startChecklistDismissedAt: null },
      profile: null,
      automationCount: 0,
      cvCount: 0,
    });
    const { startChecklist } = await service.dashboard('u1');
    expect(startChecklist).not.toBeNull();
    expect(startChecklist!.completed).toBe(0);
    expect(startChecklist!.allDone).toBe(false);
    expect(startChecklist!.done).toEqual({
      profile: false,
      search: false,
      automation: false,
      application: false,
      cv: false,
    });
  });

  it('tout est fait : allDone = true', async () => {
    const service = makeDashboardService({
      counts: 1,
      user: { firstSearchAt: new Date(), startChecklistDismissedAt: null },
      profile: { jobTargets: [{}], contractTypes: ['cdi'], locations: [{}], availableFrom: new Date() },
      automationCount: 1,
      cvCount: 1,
    });
    const { startChecklist } = await service.dashboard('u1');
    expect(startChecklist!.allDone).toBe(true);
    expect(startChecklist!.completed).toBe(5);
  });

  it('carte masquée : startChecklist = null', async () => {
    const service = makeDashboardService({
      counts: 0,
      user: { firstSearchAt: null, startChecklistDismissedAt: new Date() },
      profile: null,
      automationCount: 0,
      cvCount: 0,
    });
    const { startChecklist } = await service.dashboard('u1');
    expect(startChecklist).toBeNull();
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
