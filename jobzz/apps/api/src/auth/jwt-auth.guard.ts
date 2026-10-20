import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';
import type { JwtPayload, RequestUser } from './jwt-payload';

/**
 * Garde d'authentification : vérifie le jeton d'accès JWT (en-tête Authorization: Bearer …).
 * Les routes marquées `@Public()` sont laissées passer. La vérification du rôle côté serveur
 * se fait en plus via `RolesGuard` (CLAUDE.md §4.1).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Jeton manquant');
    }
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      const user: RequestUser = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        plan: payload.plan,
      };
      (request as Request & { user: RequestUser }).user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Jeton invalide ou expiré');
    }
  }

  private extractToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header) return null;
    const [type, token] = header.split(' ');
    return type === 'Bearer' && token ? token : null;
  }
}
