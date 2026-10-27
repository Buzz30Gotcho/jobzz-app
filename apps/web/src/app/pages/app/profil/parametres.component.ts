import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AUTH } from '@jobzz/shared';
import { AuthService } from '../../../core/auth/auth.service';
import { ProfileService } from '../../../core/profile/profile.service';
import { PrivacyService } from '../../../core/privacy/privacy.service';
import { errorMessage } from '../../auth/error-message';
import { FoundDialogComponent } from '../found-dialog.component';
import { ProfilTabsComponent } from './profil-tabs.component';

/**
 * Profil → Paramètres (CLAUDE.md §4.2, §4.12) : mail des offres, Mon abonnement,
 * changement de mot de passe, et « Mes données » (export + suppression).
 */
@Component({
  selector: 'jz-parametres',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ProfilTabsComponent, FoundDialogComponent],
  template: `
    <div class="mx-auto max-w-3xl">
      <h1 class="text-2xl font-semibold">Paramètres</h1>
      <jz-profil-tabs />

      <!-- Mail des offres -->
      <section class="jz-card mt-6">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="font-semibold">Mail des offres</h2>
            <p class="mt-1 text-sm text-text-secondary">
              Reçois par mail les offres trouvées par tes automatisations.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            [attr.aria-checked]="offerMail()"
            [disabled]="offerMailBusy()"
            (click)="toggleOfferMail()"
            class="relative h-6 w-11 shrink-0 rounded-full transition-colors"
            [class.bg-accent]="offerMail()"
            [class.bg-surface-raised]="!offerMail()"
          >
            <span
              class="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
              [class.left-5]="offerMail()"
              [class.left-0.5]="!offerMail()"
            ></span>
          </button>
        </div>
        @if (!offerMail()) {
          <p class="mt-3 text-xs text-text-muted">
            Tes automatisations restent actives, mais aucun mail ne part tant que c'est coupé.
          </p>
        }
      </section>

      <!-- Mon abonnement (visible seulement quand les offres payantes sont actives) -->
      @if (planEnforcement()) {
        <section class="jz-card mt-4 flex items-center justify-between gap-4">
          <div>
            <h2 class="font-semibold">Mon abonnement</h2>
            <p class="mt-1 text-sm text-text-secondary">Offre, renouvellement, factures, résiliation.</p>
          </div>
          <a routerLink="/app/profil/abonnement" class="jz-btn-ghost">Gérer</a>
        </section>
      }

      <!-- Mot de passe -->
      <section class="jz-card mt-4">
        <h2 class="font-semibold">Mot de passe</h2>
        <form [formGroup]="pwdForm" (ngSubmit)="changePassword()" class="mt-4 space-y-4">
          <div>
            <label for="current" class="jz-label">Mot de passe actuel</label>
            <input id="current" type="password" formControlName="currentPassword" class="jz-input" autocomplete="current-password" />
          </div>
          <div>
            <label for="next" class="jz-label">Nouveau mot de passe</label>
            <input id="next" type="password" formControlName="password" class="jz-input" autocomplete="new-password" />
            <p class="mt-1 text-xs text-text-muted">Au moins {{ minLength }} caractères.</p>
          </div>
          @if (pwdError()) {
            <p class="text-sm text-danger">{{ pwdError() }}</p>
          }
          @if (pwdDone()) {
            <p class="text-sm text-accent">Mot de passe mis à jour. Tes autres appareils ont été déconnectés.</p>
          }
          <button type="submit" class="jz-btn-primary" [disabled]="pwdForm.invalid || pwdBusy()">
            {{ pwdBusy() ? 'Enregistrement…' : 'Changer mon mot de passe' }}
          </button>
        </form>
      </section>

      <!-- J'ai trouvé ! -->
      <section class="jz-card mt-4 flex items-center justify-between gap-4">
        <div>
          <h2 class="font-semibold">J'ai trouvé un poste</h2>
          <p class="mt-1 text-sm text-text-secondary">Dis-nous ce que tu as décroché et mets tes automatisations en pause.</p>
        </div>
        <button type="button" class="jz-btn-ghost" (click)="showFound.set(true)">J'ai trouvé !</button>
      </section>

      <!-- Mes données (RGPD) -->
      <section class="jz-card mt-4">
        <h2 class="font-semibold">Mes données</h2>
        <p class="mt-1 text-sm text-text-secondary">
          Exporte toutes tes données (un fichier ZIP) ou supprime définitivement ton compte.
        </p>
        <div class="mt-4 flex flex-wrap gap-3">
          <button type="button" class="jz-btn-ghost" [disabled]="exportBusy()" (click)="exportData()">
            {{ exportBusy() ? 'Préparation…' : 'Exporter mes données' }}
          </button>
          @if (!deleteOpen()) {
            <button type="button" class="jz-btn-ghost text-danger" (click)="deleteOpen.set(true)">
              Supprimer mon compte
            </button>
          }
        </div>

        @if (deleteOpen()) {
          <div class="mt-4 rounded-card border border-danger/40 bg-danger/5 p-4">
            <p class="text-sm">
              Cette action est <strong>définitive</strong> : toutes tes données et tes fichiers
              seront supprimés immédiatement. Pour confirmer, retape ton adresse email.
            </p>
            <input
              type="email"
              class="jz-input mt-3"
              placeholder="ton@email.fr"
              [value]="confirmEmail()"
              (input)="confirmEmail.set($any($event.target).value)"
              autocomplete="off"
            />
            @if (deleteError()) {
              <p class="mt-2 text-sm text-danger">{{ deleteError() }}</p>
            }
            <div class="mt-4 flex gap-3">
              <button
                type="button"
                class="jz-btn-primary !bg-danger !text-white hover:!bg-danger"
                [disabled]="!emailMatches() || deleteBusy()"
                (click)="deleteAccount()"
              >
                {{ deleteBusy() ? 'Suppression…' : 'Supprimer définitivement' }}
              </button>
              <button type="button" class="jz-btn-ghost" (click)="cancelDelete()">Annuler</button>
            </div>
          </div>
        }
      </section>
    </div>

    @if (showFound()) {
      <jz-found-dialog (done)="showFound.set(false)" (closed)="showFound.set(false)" />
    }
  `,
})
export class ParametresComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly profile = inject(ProfileService);
  private readonly privacyService = inject(PrivacyService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly minLength = AUTH.passwordMinLength;

  readonly offerMail = computed(() => this.auth.user()?.offerMailEnabled ?? true);
  readonly offerMailBusy = signal(false);

  readonly planEnforcement = signal(false);
  readonly showFound = signal(false);

  readonly pwdForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(AUTH.passwordMinLength)]],
  });
  readonly pwdBusy = signal(false);
  readonly pwdError = signal<string | null>(null);
  readonly pwdDone = signal(false);

  readonly exportBusy = signal(false);

  readonly deleteOpen = signal(false);
  readonly confirmEmail = signal('');
  readonly deleteBusy = signal(false);
  readonly deleteError = signal<string | null>(null);
  readonly emailMatches = computed(
    () => this.confirmEmail().trim().toLowerCase() === (this.auth.user()?.email ?? '').toLowerCase(),
  );

  constructor() {
    // Le lien « Mon abonnement » n'apparaît que quand les offres payantes sont actives.
    this.http
      .get<{ planEnforcement: boolean }>('/api/health')
      .subscribe((h) => this.planEnforcement.set(h.planEnforcement));
  }

  async toggleOfferMail(): Promise<void> {
    this.offerMailBusy.set(true);
    try {
      const enabled = await this.profile.setOfferMail(!this.offerMail());
      this.auth.patchUser({ offerMailEnabled: enabled });
    } finally {
      this.offerMailBusy.set(false);
    }
  }

  async changePassword(): Promise<void> {
    if (this.pwdForm.invalid) return;
    this.pwdBusy.set(true);
    this.pwdError.set(null);
    this.pwdDone.set(false);
    try {
      const { currentPassword, password } = this.pwdForm.getRawValue();
      await this.auth.changePassword(currentPassword, password);
      this.pwdForm.reset();
      this.pwdDone.set(true);
    } catch (err) {
      this.pwdError.set(errorMessage(err, 'Impossible de changer le mot de passe.'));
    } finally {
      this.pwdBusy.set(false);
    }
  }

  async exportData(): Promise<void> {
    this.exportBusy.set(true);
    try {
      await this.privacyService.exportData();
    } finally {
      this.exportBusy.set(false);
    }
  }

  cancelDelete(): void {
    this.deleteOpen.set(false);
    this.confirmEmail.set('');
    this.deleteError.set(null);
  }

  async deleteAccount(): Promise<void> {
    if (!this.emailMatches()) return;
    this.deleteBusy.set(true);
    this.deleteError.set(null);
    try {
      await this.privacyService.deleteAccount(this.confirmEmail().trim());
      await this.auth.logout();
      await this.router.navigate(['/']);
    } catch (err) {
      this.deleteBusy.set(false);
      this.deleteError.set(errorMessage(err, 'Impossible de supprimer le compte.'));
    }
  }
}
