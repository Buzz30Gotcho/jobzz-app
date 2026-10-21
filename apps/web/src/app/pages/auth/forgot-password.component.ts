import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'jz-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <h1 class="text-xl font-semibold">Mot de passe oublié</h1>

    @if (sent()) {
      <p class="mt-4 text-text-secondary">
        Si un compte existe avec cette adresse, un email vient d'être envoyé avec un lien pour
        choisir un nouveau mot de passe. Le lien est valable 1 heure.
      </p>
      <a routerLink="/connexion" class="jz-btn-ghost mt-6 w-full">Retour à la connexion</a>
    } @else {
      <p class="mt-1 text-sm text-text-secondary">On t'envoie un lien pour en choisir un nouveau.</p>
      <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="submit()">
        <div>
          <label class="jz-label" for="email">Email</label>
          <input id="email" type="email" class="jz-input" formControlName="email" autocomplete="email" />
        </div>
        <button type="submit" class="jz-btn-primary w-full" [disabled]="loading()">
          {{ loading() ? 'Envoi…' : 'Envoyer le lien' }}
        </button>
      </form>
      <a routerLink="/connexion" class="mt-4 block text-sm text-text-secondary hover:text-text"
        >Retour à la connexion</a
      >
    }
  `,
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly sent = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    try {
      await this.auth.forgotPassword(this.form.getRawValue().email);
      this.sent.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
