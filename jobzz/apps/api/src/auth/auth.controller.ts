import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UsePipes,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import {
  loginSchema,
  registerSchema,
  requestPasswordResetSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  type AuthResponse,
  type LoginInput,
  type RegisterInput,
  type RequestPasswordResetInput,
  type ResendVerificationInput,
  type ResetPasswordInput,
  type VerifyEmailInput,
} from '@jobzz/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AppConfigService } from '../config/app-config.service';
import { UsersService } from '../users/users.service';
import { AuthService, type IssuedTokens } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { Public } from './public.decorator';
import type { RequestUser } from './jwt-payload';

const REFRESH_COOKIE = 'jobzz_refresh';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly config: AppConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(
    @Body() body: RegisterInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const issued = await this.auth.register(body, req.headers['user-agent']);
    return this.finish(res, issued);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(
    @Body() body: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const issued = await this.auth.login(body, req.headers['user-agent']);
    return this.finish(res, issued);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const token = req.cookies?.[REFRESH_COOKIE];
    const issued = await this.auth.refresh(token, req.headers['user-agent']);
    return this.finish(res, issued);
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions());
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('verify-email')
  @HttpCode(204)
  @UsePipes(new ZodValidationPipe(verifyEmailSchema))
  async verifyEmail(@Body() body: VerifyEmailInput): Promise<void> {
    await this.auth.verifyEmail(body.token);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('resend-verification')
  @HttpCode(204)
  @UsePipes(new ZodValidationPipe(resendVerificationSchema))
  async resendVerification(@Body() body: ResendVerificationInput): Promise<void> {
    await this.auth.resendVerification(body.email);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('forgot-password')
  @HttpCode(204)
  @UsePipes(new ZodValidationPipe(requestPasswordResetSchema))
  async forgotPassword(@Body() body: RequestPasswordResetInput): Promise<void> {
    await this.auth.requestPasswordReset(body.email);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('reset-password')
  @HttpCode(204)
  @UsePipes(new ZodValidationPipe(resetPasswordSchema))
  async resetPassword(@Body() body: ResetPasswordInput): Promise<void> {
    await this.auth.resetPassword(body);
  }

  @Get('me')
  async me(@CurrentUser() current: RequestUser): Promise<AuthResponse['user']> {
    const user = await this.users.findById(current.id);
    if (!user) {
      // Cas de bord : jeton valide mais compte supprimé.
      return {
        id: current.id,
        email: current.email,
        role: current.role,
        plan: current.plan,
        premiumUntil: null,
        emailVerified: false,
        offerMailEnabled: true,
      };
    }
    return this.users.toPublicUser(user);
  }

  /** Pose le cookie de rafraîchissement et renvoie la réponse d'authentification. */
  private finish(res: Response, issued: IssuedTokens): AuthResponse {
    res.cookie(REFRESH_COOKIE, issued.refreshToken, {
      ...this.cookieOptions(),
      expires: issued.refreshExpiresAt,
    });
    return issued.auth;
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: 'lax' as const,
      path: '/',
    };
  }
}
