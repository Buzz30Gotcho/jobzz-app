import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AUTH } from '@jobzz/shared';
import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from './error-message';

@Component({
  selector: 'jz-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <h1 class="text-xl font-semibold">Créer mon compte</h1>
    <p class="mt-1 text-sm text-text-secondary">Gratuit, et utile dès la première minute.</p>

    <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="submit()">
      <div>
        <label class="jz-label" for="email">Email</label>
        <input id="email" type="email" class="jz-input" formControlName="email" autocomplete="email" />
      </div>
      <div>
        <label class="jz-label" for="password">Mot de passe</label>
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
        {{ loading() ? 'Création…' : 'Créer mon compte' }}
      </button>
    </form>

    <p class="mt-4 text-sm text-text-secondary">
      Déjà un compte ? <a routerLink="/connexion" class="text-accent hover:underline">Se connecter</a>
    </p>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly minLength = AUTH.passwordMinLength;
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(AUTH.passwordMinLength)]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.register(this.form.getRawValue());
      await this.router.navigateByUrl('/app');
    } catch (err) {
      this.error.set(errorMessage(err, 'Création impossible. Réessaie.'));
    } finally {
      this.loading.set(false);
    }
  }
}
