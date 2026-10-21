import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { PrismaService } from '../prisma/prisma.service';
import type { AiProvider } from './ai-provider';
import { AiService, AiUnavailableError } from './ai.service';

const schema = z.object({ subject: z.string(), body: z.string().min(1) });

function makeService(provider: Partial<AiProvider>) {
  const full: AiProvider = {
    model: 'test-model',
    isAvailable: () => true,
    generateText: vi.fn(),
    generateJson: vi.fn(),
    ...provider,
  };
  const prisma = { aiCallLog: { create: vi.fn().mockResolvedValue({}) } } as unknown as PrismaService;
  return { service: new AiService(full, prisma), prisma };
}

const params = {
  feature: 'test',
  system: 'sys',
  prompt: 'prompt',
  schema,
  timeoutMs: 1000,
};

describe('AiService.generateJson', () => {
  it('renvoie la sortie validée en cas de succès et journalise', async () => {
    const { service, prisma } = makeService({
      generateJson: vi.fn().mockResolvedValue({ subject: 'Objet', body: 'Corps' }),
    });
    const result = await service.generateJson(params);
    expect(result).toEqual({ subject: 'Objet', body: 'Corps' });
    expect((prisma.aiCallLog.create as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ success: true, model: 'test-model' }) }),
    );
  });

  it('réessaie une fois puis accepte une sortie corrigée', async () => {
    const generateJson = vi
      .fn()
      .mockResolvedValueOnce({ subject: 'Objet' }) // invalide : body manquant
      .mockResolvedValueOnce({ subject: 'Objet', body: 'Corps' });
    const { service } = makeService({ generateJson });
    const result = await service.generateJson(params);
    expect(result.body).toBe('Corps');
    expect(generateJson).toHaveBeenCalledTimes(2);
  });

  it('lève AiUnavailableError si la sortie reste invalide', async () => {
    const { service } = makeService({ generateJson: vi.fn().mockResolvedValue({ subject: 'x' }) });
    await expect(service.generateJson(params)).rejects.toBeInstanceOf(AiUnavailableError);
  });

  it('lève AiUnavailableError (repli) quand le fournisseur échoue', async () => {
    const { service } = makeService({ generateJson: vi.fn().mockRejectedValue(new Error('timeout')) });
    await expect(service.generateJson(params)).rejects.toBeInstanceOf(AiUnavailableError);
  });

  it('lève AiUnavailableError quand l\'IA est désactivée', async () => {
    const { service } = makeService({ isAvailable: () => false });
    await expect(service.generateJson(params)).rejects.toBeInstanceOf(AiUnavailableError);
  });

  it('sert la valeur en cache pour la même clé', async () => {
    const generateJson = vi.fn().mockResolvedValue({ subject: 'Objet', body: 'Corps' });
    const { service } = makeService({ generateJson });
    await service.generateJson({ ...params, cacheKey: 'k1' });
    await service.generateJson({ ...params, cacheKey: 'k1' });
    expect(generateJson).toHaveBeenCalledTimes(1);
  });
});
