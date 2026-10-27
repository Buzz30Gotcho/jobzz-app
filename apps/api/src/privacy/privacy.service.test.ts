import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service';
import type { MailSender } from '../mail/mail.service';
import type { AppConfigService } from '../config/app-config.service';
import { PrivacyService } from './privacy.service';

function makeService(prismaOverrides: Record<string, unknown>, send = vi.fn().mockResolvedValue(undefined)) {
  const prisma = prismaOverrides as unknown as PrismaService;
  const mail = { send } as unknown as MailSender;
  const config = { get: () => 'Jobzz' } as unknown as AppConfigService;
  return { service: new PrivacyService(prisma, mail, config), send };
}

describe('PrivacyService.deleteAccount', () => {
  it("refuse si l'email de confirmation ne correspond pas", async () => {
    const del = vi.fn();
    const { service } = makeService({
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'u1', email: 'fred@gmail.com' }), delete: del },
    });
    await expect(service.deleteAccount('u1', 'autre@gmail.com')).rejects.toThrow();
    expect(del).not.toHaveBeenCalled();
  });

  it('supprime le compte quand l’email correspond (comparaison normalisée) et envoie le mail', async () => {
    const del = vi.fn().mockResolvedValue(undefined);
    const { service, send } = makeService({
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'u1', email: 'fred@gmail.com' }), delete: del },
    });
    await service.deleteAccount('u1', '  Fred@Gmail.com ');
    expect(del).toHaveBeenCalledWith({ where: { id: 'u1' } });
    expect(send).toHaveBeenCalledOnce();
  });

  it('ne remet pas la suppression en cause si le mail échoue', async () => {
    const del = vi.fn().mockResolvedValue(undefined);
    const { service } = makeService(
      { user: { findUnique: vi.fn().mockResolvedValue({ id: 'u1', email: 'fred@gmail.com' }), delete: del } },
      vi.fn().mockRejectedValue(new Error('smtp down')),
    );
    await expect(service.deleteAccount('u1', 'fred@gmail.com')).resolves.toBeUndefined();
    expect(del).toHaveBeenCalledOnce();
  });
});

describe('PrivacyService.collectExport', () => {
  it('produit un fichier JSON par type de données', async () => {
    const { service } = makeService({
      user: { findUniqueOrThrow: vi.fn().mockResolvedValue({ email: 'fred@gmail.com' }) },
      profile: { findUnique: vi.fn().mockResolvedValue(null) },
      application: { findMany: vi.fn().mockResolvedValue([]) },
      automation: { findMany: vi.fn().mockResolvedValue([]) },
      cvDocument: { findUnique: vi.fn().mockResolvedValue(null) },
      cvAnalysis: { findMany: vi.fn().mockResolvedValue([]) },
      cvOfferComparison: { findMany: vi.fn().mockResolvedValue([]) },
      ticket: { findMany: vi.fn().mockResolvedValue([]) },
      jobOutcome: { findMany: vi.fn().mockResolvedValue([]) },
      subscriptionPeriod: { findMany: vi.fn().mockResolvedValue([]) },
    });
    const files = await service.collectExport('u1');
    const names = files.map((f) => f.name);
    expect(names).toContain('compte.json');
    expect(names).toContain('candidatures.json');
    expect(names).toContain('tickets.json');
    expect(names).toContain('jai-trouve.json');
    expect(names.length).toBe(9);
  });
});
