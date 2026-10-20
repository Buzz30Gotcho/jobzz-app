/**
 * Crée (ou promeut) le compte administrateur à partir de ADMIN_EMAIL / ADMIN_PASSWORD.
 * Usage : `pnpm --filter @jobzz/api create-admin`.
 */
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

loadEnv({ path: resolve(__dirname, '../../../../.env') });

async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL et ADMIN_PASSWORD sont requis dans .env');
  }

  const prisma = new PrismaClient();
  try {
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const user = await prisma.user.upsert({
      where: { email },
      update: { role: 'admin', plan: 'premium' },
      create: {
        email,
        passwordHash,
        role: 'admin',
        plan: 'premium',
        emailVerifiedAt: new Date(),
      },
    });
    console.log(`Compte admin prêt : ${user.email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
