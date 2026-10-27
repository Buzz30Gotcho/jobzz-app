import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service';
import { OutcomesService } from './outcomes.service';

function makeService(prismaOverrides: Record<string, unknown>) {
  return new OutcomesService(prismaOverrides as unknown as PrismaService);
}

describe('OutcomesService.cancel', () => {
  it("refuse d'annuler l'événement d'un autre utilisateur", async () => {
    const update = vi.fn();
    const service = makeService({
      jobOutcome: { findUnique: vi.fn().mockResolvedValue({ id: 'o1', userId: 'owner' }), update },
    });
    await expect(service.cancel('intrus', 'o1')).rejects.toThrow();
    expect(update).not.toHaveBeenCalled();
  });

  it('annule (cancelledAt) son propre événement', async () => {
    const update = vi.fn().mockResolvedValue({
      id: 'o1',
      contractType: 'cdi',
      companyName: null,
      helpfulness: null,
      foundAt: new Date(),
      cancelledAt: new Date(),
    });
    const service = makeService({
      jobOutcome: { findUnique: vi.fn().mockResolvedValue({ id: 'o1', userId: 'owner' }), update },
    });
    const res = await service.cancel('owner', 'o1');
    expect(res.cancelledAt).not.toBeNull();
    expect(update).toHaveBeenCalledOnce();
  });
});

describe('OutcomesService.pauseAllAutomations', () => {
  it('met en pause uniquement les automatisations actives de l’utilisateur', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 2 });
    const service = makeService({ automation: { updateMany } });
    const res = await service.pauseAllAutomations('u1');
    expect(res.paused).toBe(2);
    expect(updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', status: 'active' },
      data: { status: 'en_pause' },
    });
  });
});
