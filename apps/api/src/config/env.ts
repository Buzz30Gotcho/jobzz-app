import { z } from 'zod';

/**
 * Validation des variables d'environnement au démarrage.
 * Le serveur refuse de démarrer si une variable obligatoire manque ou si une clé Stripe
 * réelle (`sk_live_…`) est détectée hors production (cf. CLAUDE.md §2.1).
 */
const booleanish = z
  .string()
  .optional()
  .transform((v) => v === 'true' || v === '1');

const envSchema = z
  .object({
    APP_NAME: z.string().default('Jobzz'),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    APP_URL: z.string().url().default('http://localhost:4200'),
    API_URL: z.string().url().default('http://localhost:3000'),
    API_PORT: z.coerce.number().int().positive().default(3000),

    DATABASE_URL: z.string().min(1, 'DATABASE_URL est obligatoire'),

    JWT_SECRET: z.string().min(16, 'JWT_SECRET doit faire au moins 16 caractères'),
    REFRESH_TOKEN_SECRET: z
      .string()
      .min(16, 'REFRESH_TOKEN_SECRET doit faire au moins 16 caractères'),

    ADMIN_EMAIL: z.string().email().optional(),
    ADMIN_PASSWORD: z.string().min(10).optional(),

    SMTP_HOST: z.string().default('localhost'),
    SMTP_PORT: z.coerce.number().int().positive().default(1025),
    MAIL_FROM: z.string().default('Jobzz <bonjour@jobzz.local>'),

    JOB_SOURCES_MODE: z.enum(['demo', 'live']).default('demo'),
    FRANCE_TRAVAIL_CLIENT_ID: z.string().optional().default(''),
    FRANCE_TRAVAIL_CLIENT_SECRET: z.string().optional().default(''),
    LBA_API_KEY: z.string().optional().default(''),
    ADZUNA_APP_ID: z.string().optional().default(''),
    ADZUNA_APP_KEY: z.string().optional().default(''),

    AI_ENABLED: booleanish,
    OLLAMA_URL: z.string().url().default('http://localhost:11434'),
    OLLAMA_MODEL: z.string().default('qwen2.5:7b'),

    PLAN_ENFORCEMENT: booleanish,

    STRIPE_SECRET_KEY: z.string().optional().default(''),
    STRIPE_PUBLISHABLE_KEY: z.string().optional().default(''),
    STRIPE_WEBHOOK_SECRET: z.string().optional().default(''),
    STRIPE_PRICE_MONTHLY: z.string().optional().default(''),
    STRIPE_PRICE_LAUNCH: z.string().optional().default(''),
    STRIPE_PRICE_PASS_3_MONTHS: z.string().optional().default(''),

    BETA_INVITE_CODE: z.string().optional().default(''),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production' && env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['STRIPE_SECRET_KEY'],
        message:
          'Clé Stripe réelle (sk_live_) détectée hors production. En local, utilise une clé de test (sk_test_…).',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `  - ${i.path.join('.') || '(racine)'} : ${i.message}`)
      .join('\n');
    throw new Error(`Configuration invalide (.env) :\n${details}`);
  }
  return result.data;
}
