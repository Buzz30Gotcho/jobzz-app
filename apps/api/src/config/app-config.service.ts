import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from './env';

/**
 * Accès typé à la configuration validée. Un seul endroit où lire `process.env` côté app.
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get<K extends keyof Env>(key: K): Env[K] {
    return this.config.get(key, { infer: true });
  }

  get isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }

  get planEnforcement(): boolean {
    return this.get('PLAN_ENFORCEMENT');
  }

  get stripeConfigured(): boolean {
    return this.get('STRIPE_SECRET_KEY').length > 0;
  }
}
