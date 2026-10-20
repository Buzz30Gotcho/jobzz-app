import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AUTH } from '@jobzz/shared';
import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from './error-message';

@Component({
  selector: 'jz-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <h1 class="text-xl font-semibold">Connexion</h1>
    <p class="mt-1 text-sm text-text-secondary">Content de te revoir.</p>

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
          autocomplete="current-password"
        />
      </div>

      @if (error()) {
        <p class="jz-field-error">{{ error() }}</p>
      }

      <button type="submit" class="jz-btn-primary w-full" [disabled]="loading()">
        {{ loading() ? 'Connexion…' : 'Se connecter' }}
      </button>
    </form>

    <div class="mt-4 flex justify-between text-sm text-text-secondary">
      <a routerLink="/mot-de-passe-oublie" class="hover:text-text">Mot de passe oublié ?</a>
      <a routerLink="/inscription" class="hover:text-text">Créer un compte</a>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

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
      await this.auth.login(this.form.getRawValue());
      const redirect = this.route.snapshot.queryParamMap.get('redirect') ?? '/app';
      await this.router.navigateByUrl(redirect);
    } catch (err) {
      this.error.set(errorMessage(err, 'Email ou mot de passe incorrect.'));
    } finally {
      this.loading.set(false);
    }
  }
}
