import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AUTH } from '@jobzz/shared';
import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from './error-message';

@Component({
  selector: 'jz-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <h1 class="text-xl font-semibold">Nouveau mot de passe</h1>

    @if (!token) {
      <p class="mt-4 text-text-secondary">Lien invalide. Redemande un lien de réinitialisation.</p>
      <a routerLink="/mot-de-passe-oublie" class="jz-btn-ghost mt-6 w-full">Redemander un lien</a>
    } @else if (done()) {
      <p class="mt-4 text-text-secondary">
        Ton mot de passe est à jour. Toutes tes sessions ont été déconnectées.
      </p>
      <a routerLink="/connexion" class="jz-btn-primary mt-6 w-full">Se connecter</a>
    } @else {
      <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="submit()">
        <div>
          <label class="jz-label" for="password">Nouveau mot de passe</label>
          <input
            id="password"
            type="password"
            class="jz-input"
            formControlName="password"
            autocomplete="new-password"
          />
          <p class="mt-1 text-xs text-text-muted">Au moins {{ minLength }} caractères.</p>
        </div>
        @if (error()) {
          <p class="jz-field-error">{{ error() }}</p>
        }
        <button type="submit" class="jz-btn-primary w-full" [disabled]="loading()">
          {{ loading() ? 'Enregistrement…' : 'Changer mon mot de passe' }}
        </button>
      </form>
    }
  `,
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly minLength = AUTH.passwordMinLength;
  readonly token = this.route.snapshot.queryParamMap.get('token');
  readonly loading = signal(false);
  readonly done = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(AUTH.passwordMinLength)]],
  });

  async submit(): Promise<void> {
    if (!this.token || this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.resetPassword(this.token, this.form.getRawValue().password);
      this.done.set(true);
    } catch (err) {
      this.error.set(errorMessage(err, 'Lien invalide ou expiré.'));
    } finally {
      this.loading.set(false);
    }
  }
}
