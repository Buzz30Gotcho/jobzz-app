import { HttpErrorResponse } from '@angular/common/http';

/** Extrait un message lisible d'une erreur HTTP (message serveur si présent). */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    const message = err.error?.message;
    if (typeof message === 'string') {
      return message;
    }
    if (Array.isArray(err.error?.issues) && err.error.issues[0]?.message) {
      return err.error.issues[0].message as string;
    }
  }
  return fallback;
}
