import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@jobzz/shared';
import type { RequestUser } from './jwt-payload';

export const ROLES_KEY = 'roles';

/** Restreint une route à certains rôles (vérifié côté serveur, CLAUDE.md §4.1). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestUser | undefined;
    if (!user || !required.includes(user.role)) {
      throw new ForbiddenException('Accès réservé');
    }
    return true;
  }
}
