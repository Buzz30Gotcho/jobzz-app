import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Intercepteur HTTP :
 *  - ajoute le jeton d'accès (Authorization: Bearer …) ;
 *  - envoie les cookies (withCredentials) pour le cookie de rafraîchissement ;
 *  - sur un 401, tente un rafraîchissement unique puis rejoue la requête.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const withAuth = (token: string | null) =>
    req.clone({
      withCredentials: true,
      setHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    });

  // On ne tente pas de rafraîchir sur les routes d'auth elles-mêmes.
  const isAuthRoute = req.url.includes('/api/auth/');

  return next(withAuth(auth.accessToken)).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isAuthRoute) {
        return throwError(() => error);
      }
      return from(auth.refresh()).pipe(
        switchMap((ok) =>
          ok ? next(withAuth(auth.accessToken)) : throwError(() => error),
        ),
      );
    }),
  );
};
