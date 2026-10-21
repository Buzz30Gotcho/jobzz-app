import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ZodSchema } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { AI_PROVIDER, type AiProvider } from './ai-provider';

/** Levée quand l'IA est indisponible : l'appelant doit alors **retomber sur le mode sans IA**. */
export class AiUnavailableError extends Error {
  constructor(message = 'IA indisponible') {
    super(message);
    this.name = 'AiUnavailableError';
  }
}

export interface GenerateJsonParams<T> {
  feature: string;
  system: string;
  prompt: string;
  schema: ZodSchema<T>;
  timeoutMs: number;
  /** Clé de cache (empreinte) facultative. */
  cacheKey?: string;
}

const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Service d'IA (CLAUDE.md §5) : délais maximum, nouvelle tentative sur sortie invalide, validation
 * Zod systématique, cache par empreinte, journal des appels (sans contenu), et **repli** en cas
 * d'échec (l'appelant attrape `AiUnavailableError`). L'IA améliore, elle n'est jamais indispensable.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly cache = new Map<string, { value: unknown; expiresAt: number }>();

  constructor(
    @Inject(AI_PROVIDER) private readonly provider: AiProvider,
    private readonly prisma: PrismaService,
  ) {}

  isAvailable(): boolean {
    return this.provider.isAvailable();
  }

  async generateJson<T>(params: GenerateJsonParams<T>): Promise<T> {
    if (!this.provider.isAvailable()) throw new AiUnavailableError();

    if (params.cacheKey) {
      const hit = this.cache.get(params.cacheKey);
      if (hit && hit.expiresAt > Date.now()) return hit.value as T;
    }

    const started = Date.now();
    let success = false;
    try {
      const value = await this.attempt(params);
      success = true;
      if (params.cacheKey) {
        this.cache.set(params.cacheKey, { value, expiresAt: Date.now() + CACHE_TTL_MS });
      }
      return value;
    } finally {
      await this.log(params.feature, Date.now() - started, success);
    }
  }

  /** Un essai + une nouvelle tentative en cas de sortie non conforme au schéma. */
  private async attempt<T>(params: GenerateJsonParams<T>): Promise<T> {
    const options = { system: params.system, timeoutMs: params.timeoutMs, temperature: 0.4 };
    try {
      const raw = await this.provider.generateJson(params.prompt, options);
      const parsed = params.schema.safeParse(raw);
      if (parsed.success) return parsed.data;

      // Deuxième essai : on rappelle l'IA en lui indiquant l'erreur de format.
      const retryPrompt = `${params.prompt}\n\nTa réponse précédente était invalide (${parsed.error.issues
        .map((i) => i.message)
        .join('; ')}). Renvoie UNIQUEMENT un JSON valide respectant le format demandé.`;
      const rawRetry = await this.provider.generateJson(retryPrompt, options);
      const retryParsed = params.schema.safeParse(rawRetry);
      if (retryParsed.success) return retryParsed.data;

      throw new AiUnavailableError('Sortie IA invalide après nouvelle tentative');
    } catch (err) {
      if (err instanceof AiUnavailableError) throw err;
      // Timeout, réseau, JSON illisible… : repli sans IA.
      this.logger.warn(`Appel IA « ${params.feature} » échoué : ${(err as Error).message}`);
      throw new AiUnavailableError((err as Error).message);
    }
  }

  private async log(feature: string, durationMs: number, success: boolean): Promise<void> {
    try {
      await this.prisma.aiCallLog.create({
        data: { feature, model: this.provider.model, durationMs, success },
      });
    } catch {
      // Le journal ne doit jamais faire échouer une requête.
    }
  }
}
