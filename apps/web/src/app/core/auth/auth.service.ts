import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type {
  AuthResponse,
  LoginInput,
  PublicUser,
  RegisterInput,
} from '@jobzz/shared';

const API = '/api/auth';

/**
 * Service d'authentification à base de signals.
 * Le jeton d'accès JWT est gardé **en mémoire uniquement** (jamais en localStorage).
 * Le jeton de rafraîchissement vit dans un cookie httpOnly géré par le serveur.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _user = signal<PublicUser | null>(null);
  private readonly _ready = signal(false);

  readonly user = this._user.asReadonly();
  /** Vrai une fois la restauration de session initiale terminée. */
  readonly ready = this._ready.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'admin');

  /** Jeton d'accès courant, lu par l'intercepteur HTTP. */
  accessToken: string | null = null;

  async register(input: RegisterInput): Promise<void> {
    this.apply(await firstValueFrom(this.http.post<AuthResponse>(`${API}/register`, input)));
  }

  async login(input: LoginInput): Promise<void> {
    this.apply(await firstValueFrom(this.http.post<AuthResponse>(`${API}/login`, input)));
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${API}/logout`, {}));
    } finally {
      this.accessToken = null;
      this._user.set(null);
    }
  }

  /** Rafraîchit le jeton d'accès à partir du cookie. Renvoie vrai si une session est active. */
  async refresh(): Promise<boolean> {
    try {
      this.apply(await firstValueFrom(this.http.post<AuthResponse>(`${API}/refresh`, {})));
      return true;
    } catch {
      this.accessToken = null;
      this._user.set(null);
      return false;
    }
  }

  /** Appelé au démarrage de l'app (APP_INITIALIZER). */
  async restore(): Promise<void> {
    await this.refresh();
    this._ready.set(true);
  }

  verifyEmail(token: string) {
    return firstValueFrom(this.http.post(`${API}/verify-email`, { token }));
  }

  resendVerification(email: string) {
    return firstValueFrom(this.http.post(`${API}/resend-verification`, { email }));
  }

  forgotPassword(email: string) {
    return firstValueFrom(this.http.post(`${API}/forgot-password`, { email }));
  }

  resetPassword(token: string, password: string) {
    return firstValueFrom(this.http.post(`${API}/reset-password`, { token, password }));
  }

  /** Change le mot de passe (connecté) : le serveur ré-émet une session fraîche. */
  async changePassword(currentPassword: string, password: string): Promise<void> {
    this.apply(
      await firstValueFrom(
        this.http.post<AuthResponse>(`${API}/change-password`, { currentPassword, password }),
      ),
    );
  }

  /** Met à jour localement quelques champs de l'utilisateur courant (ex. mail des offres). */
  patchUser(partial: Partial<PublicUser>): void {
    const current = this._user();
    if (current) this._user.set({ ...current, ...partial });
  }

  private apply(res: AuthResponse): void {
    this.accessToken = res.accessToken;
    this._user.set(res.user);
  }
}
