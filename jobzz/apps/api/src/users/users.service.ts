import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import type { PublicUser } from '@jobzz/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /** Met à jour `lastActiveAt` au plus une fois par heure (cf. statistiques admin). */
  async touchActivity(userId: string): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    await this.prisma.user.updateMany({
      where: { id: userId, OR: [{ lastActiveAt: null }, { lastActiveAt: { lt: oneHourAgo } }] },
      data: { lastActiveAt: new Date() },
    });
  }

  /** Représentation publique renvoyée au front (jamais de hash ni de secret). */
  toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
      premiumUntil: user.premiumUntil ? user.premiumUntil.toISOString() : null,
      emailVerified: user.emailVerifiedAt !== null,
      offerMailEnabled: user.offerMailEnabled,
    };
  }
}
