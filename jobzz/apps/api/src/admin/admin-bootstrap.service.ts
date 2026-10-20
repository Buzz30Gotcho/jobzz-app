import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import * as argon2 from 'argon2';
import { normalizeEmail } from '@jobzz/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/app-config.service';

/**
 * Crée le compte administrateur au démarrage s'il n'existe pas (ADMIN_EMAIL / ADMIN_PASSWORD).
 * Jamais via l'interface publique (CLAUDE.md §4.11). Idempotent.
 */
@Injectable()
export class AdminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const email = this.config.get('ADMIN_EMAIL');
    const password = this.config.get('ADMIN_PASSWORD');
    if (!email || !password) {
      this.logger.warn('ADMIN_EMAIL / ADMIN_PASSWORD absents : aucun compte admin créé.');
      return;
    }

    const normalized = normalizeEmail(email);
    const existing = await this.prisma.user.findUnique({ where: { email: normalized } });
    if (existing) {
      if (existing.role !== 'admin') {
        await this.prisma.user.update({ where: { id: existing.id }, data: { role: 'admin' } });
        this.logger.log(`Rôle admin attribué à ${email}.`);
      }
      return;
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    await this.prisma.user.create({
      data: {
        email: normalized,
        passwordHash,
        role: 'admin',
        plan: 'premium',
        emailVerifiedAt: new Date(),
      },
    });
    this.logger.log(`Compte admin créé : ${email}.`);
  }
}
