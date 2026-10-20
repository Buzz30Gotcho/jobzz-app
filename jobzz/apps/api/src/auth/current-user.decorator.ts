import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { RequestUser } from './jwt-payload';

/** Injecte l'utilisateur authentifié de la requête dans un paramètre de contrôleur. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as RequestUser;
  },
);
