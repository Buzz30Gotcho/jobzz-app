import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import type { PrismaConfig } from 'prisma';

// Les secrets vivent dans le .env à la racine du monorepo (CLAUDE.md §9).
loadEnv({ path: path.resolve(__dirname, '../../.env') });

export default {
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
} satisfies PrismaConfig;
