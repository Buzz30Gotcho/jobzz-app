import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import {
  AUTH,
  normalizeEmail,
  type AuthResponse,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
} from '@jobzz/shared';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { MailSender } from '../mail/mail.service';
import { resetPasswordMail, verifyEmailMail } from '../mail/templates';
import { AppConfigService } from '../config/app-config.service';
import { generateOpaqueToken, hashToken } from './tokens';
import type { JwtPayload } from './jwt-payload';

/** Jeton d'accès + jeton de rafraîchissement en clair (ce dernier part en cookie httpOnly). */
export interface IssuedTokens {
  auth: AuthResponse;
  refreshToken: string;
  refreshExpiresAt: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly mail: MailSender,
    private readonly config: AppConfigService,
  ) {}

  // ─────────────────────────── Inscription & vérification ───────────────────────────

  async register(input: RegisterInput, userAgent?: string): Promise<IssuedTokens> {
    const betaCode = this.config.get('BETA_INVITE_CODE');
    if (betaCode && input.inviteCode !== betaCode) {
      throw new BadRequestException("Code d'invitation invalide.");
    }

    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      throw new BadRequestException('Un compte existe déjà avec cette adresse.');
    }

    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    const user = await this.prisma.user.create({
      data: { email: normalizeEmail(input.email), passwordHash },
    });

    await this.sendVerificationEmail(user);
    return this.issueTokens(user, userAgent);
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    // Message identique que le compte existe ou non (pas de fuite d'information).
    if (!user || user.emailVerifiedAt) {
      return;
    }
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await this.prisma.emailToken.count({
      where: { userId: user.id, type: 'verify', createdAt: { gte: since } },
    });
    if (recent >= AUTH.emailVerifyMaxPerHour) {
      throw new BadRequestException('Trop de demandes. Réessaie dans une heure.');
    }
    await this.sendVerificationEmail(user);
  }

  private async sendVerificationEmail(user: User): Promise<void> {
    const token = generateOpaqueToken();
    await this.prisma.emailToken.create({
      data: {
        userId: user.id,
        type: 'verify',
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + AUTH.emailVerifyTtlHours * 60 * 60 * 1000),
      },
    });
    const url = `${this.config.get('APP_URL')}/verifier-email?token=${token}`;
    await this.mail.send(verifyEmailMail(this.config.get('APP_NAME'), user.email, url));
  }

  async verifyEmail(token: string): Promise<void> {
    const record = await this.prisma.emailToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!record || record.type !== 'verify' || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Lien de vérification invalide ou expiré.');
    }
    await this.prisma.$transaction([
      this.prisma.emailToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      }),
    ]);
  }

  // ─────────────────────────── Connexion / sessions ───────────────────────────

  async login(input: LoginInput, userAgent?: string): Promise<IssuedTokens> {
    const user = await this.users.findByEmail(input.email);
    const invalid = new UnauthorizedException('Email ou mot de passe incorrect.');
    if (!user) {
      // On hache quand même pour égaliser le temps de réponse (anti-énumération).
      await argon2.hash(input.password).catch(() => undefined);
      throw invalid;
    }
    if (user.disabledAt) {
      throw new UnauthorizedException('Ce compte est désactivé.');
    }
    const ok = await argon2.verify(user.passwordHash, input.password).catch(() => false);
    if (!ok) {
      throw invalid;
    }
    await this.users.touchActivity(user.id);
    return this.issueTokens(user, userAgent);
  }

  /** Rotation du jeton de rafraîchissement : l'ancien est révoqué, un nouveau est émis. */
  async refresh(presentedToken: string, userAgent?: string): Promise<IssuedTokens> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(presentedToken) },
      include: { user: true },
    });
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expirée, reconnecte-toi.');
    }
    if (record.user.disabledAt) {
      throw new UnauthorizedException('Ce compte est désactivé.');
    }
    const issued = await this.issueTokens(record.user, userAgent);
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    await this.users.touchActivity(record.user.id);
    return issued;
  }

  async logout(presentedToken: string | undefined): Promise<void> {
    if (!presentedToken) return;
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(presentedToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ─────────────────────────── Mot de passe oublié ───────────────────────────

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    // Même réponse que l'email existe ou non.
    if (!user) return;
    const token = generateOpaqueToken();
    await this.prisma.emailToken.create({
      data: {
        userId: user.id,
        type: 'reset',
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + AUTH.passwordResetTtlHours * 60 * 60 * 1000),
      },
    });
    const url = `${this.config.get('APP_URL')}/reinitialiser-mot-de-passe?token=${token}`;
    await this.mail.send(resetPasswordMail(this.config.get('APP_NAME'), user.email, url));
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const record = await this.prisma.emailToken.findUnique({
      where: { tokenHash: hashToken(input.token) },
    });
    if (!record || record.type !== 'reset' || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Lien de réinitialisation invalide ou expiré.');
    }
    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    await this.prisma.$transaction([
      this.prisma.emailToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      // Toutes les sessions sont révoquées après un changement de mot de passe.
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  // ─────────────────────────── Émission des jetons ───────────────────────────

  private async issueTokens(user: User, userAgent?: string): Promise<IssuedTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    };
    const accessToken = await this.jwt.signAsync(payload, { expiresIn: AUTH.accessTokenTtl });

    const refreshToken = generateOpaqueToken();
    const refreshExpiresAt = new Date(Date.now() + AUTH.refreshTokenTtlDays * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: refreshExpiresAt,
        userAgent: userAgent?.slice(0, 255),
      },
    });

    return {
      auth: { accessToken, user: this.users.toPublicUser(user) },
      refreshToken,
      refreshExpiresAt,
    };
  }
}
