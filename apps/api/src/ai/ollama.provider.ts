import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import type { AiGenerateOptions, AiProvider } from './ai-provider';

/**
 * Fournisseur Ollama (local). Appelle l'API `/api/generate` en mode non-stream. La sortie JSON
 * est demandée via `format: 'json'` ; la validation stricte (Zod) est faite par `AiService`.
 *
 * Donnée non fiable : le texte des offres/CV est inséré par l'appelant dans des balises
 * délimitées, et la consigne système interdit de suivre toute instruction qu'il contiendrait.
 */
@Injectable()
export class OllamaProvider implements AiProvider {
  private readonly logger = new Logger(OllamaProvider.name);

  constructor(private readonly config: AppConfigService) {}

  get model(): string {
    return this.config.get('OLLAMA_MODEL');
  }

  isAvailable(): boolean {
    return this.config.get('AI_ENABLED');
  }

  generateText(prompt: string, options: AiGenerateOptions): Promise<string> {
    return this.call(prompt, options, false) as Promise<string>;
  }

  async generateJson(prompt: string, options: AiGenerateOptions): Promise<unknown> {
    const raw = (await this.call(prompt, options, true)) as string;
    return JSON.parse(raw);
  }

  private async call(prompt: string, options: AiGenerateOptions, json: boolean): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs);
    try {
      const res = await fetch(`${this.config.get('OLLAMA_URL')}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          prompt,
          system: options.system,
          stream: false,
          format: json ? 'json' : undefined,
          options: { temperature: options.temperature ?? 0.4 },
        }),
      });
      if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
      const data = (await res.json()) as { response?: string };
      return data.response ?? '';
    } finally {
      clearTimeout(timer);
    }
  }
}
