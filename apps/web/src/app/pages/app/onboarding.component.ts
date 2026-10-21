import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  CONTRACT_TYPES,
  suggestSkills,
  type ContractType,
  type JobTarget,
  type ProfileLocation,
  type ProfileUpdateInput,
} from '@jobzz/shared';
import { AuthService } from '../../core/auth/auth.service';
import { ProfileService } from '../../core/profile/profile.service';
import { MetierFieldComponent } from '../../shared/metier-field.component';
import { CommuneFieldComponent } from '../../shared/commune-field.component';
import { TagsFieldComponent } from '../../shared/tags-field.component';

const CONTRACT_LABELS: Record<ContractType, string> = {
  alternance: 'Alternance',
  stage: 'Stage',
  cdd: 'CDD',
  cdi: 'CDI',
};

/**
 * Accueil guidé en 3 écrans (CLAUDE.md §3), chacun passable :
 * 1. Qu'est-ce que tu cherches ? (prénom facultatif + métier, contrat, ville, date de début) ;
 * 2. Compétences en un clic (suggestions selon le métier) ;
 * 3. Et si les offres venaient à toi ? (les automatisations arrivent à l'étape 6).
 */
@Component({
  selector: 'jz-onboarding',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, MetierFieldComponent, CommuneFieldComponent, TagsFieldComponent],
  template: `
    <div class="mx-auto max-w-2xl py-4">
      <!-- Progression -->
      <div class="mb-8 flex items-center justify-center gap-2" aria-hidden="true">
        @for (n of [1, 2, 3]; track n) {
          <span class="h-1.5 w-10 rounded-full" [class]="n <= step() ? 'bg-accent' : 'bg-surface-raised'"></span>
        }
      </div>

      @if (step() === 1) {
        <h1 class="text-2xl font-semibold">Qu'est-ce que tu cherches ?</h1>
        <p class="mt-1 text-text-secondary">On s'en sert pour trouver les offres qui te correspondent.</p>

        <div class="mt-6 space-y-6">
          <div>
            <label class="jz-label" for="prenom">Ton prénom <span class="text-text-muted">(facultatif)</span></label>
            <input id="prenom" class="jz-input" [(ngModel)]="firstName" placeholder="Pour un accueil plus sympa" />
          </div>
          <div>
            <span class="jz-label">Métier(s) visé(s)</span>
            <jz-metier-field [(value)]="jobTargets" />
          </div>
          <div>
            <span class="jz-label">Type(s) de contrat</span>
            <div class="flex flex-wrap gap-2">
              @for (type of contractTypesList; track type) {
                <button
                  type="button"
                  (click)="toggleContract(type)"
                  [class]="
                    contractTypes().includes(type)
                      ? 'rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-ink'
                      : 'rounded-full border border-border px-4 py-1.5 text-sm text-text-secondary hover:text-text'
                  "
                >
                  {{ contractLabels[type] }}
                </button>
              }
            </div>
          </div>
          <div>
            <span class="jz-label">Ville(s) et rayon</span>
            <jz-commune-field [(value)]="locations" />
          </div>
          <div>
            <label class="jz-label" for="date">Date de début possible</label>
            <input id="date" type="date" class="jz-input" [(ngModel)]="availableFrom" />
          </div>
        </div>
      } @else if (step() === 2) {
        <h1 class="text-2xl font-semibold">Tes compétences</h1>
        <p class="mt-1 text-text-secondary">En un clic d'après ton métier — ajoute, retire, complète.</p>
        <div class="mt-6">
          <jz-tags-field [(value)]="skills" [suggestions]="skillSuggestions()" placeholder="Ajoute une compétence puis Entrée" />
        </div>
      } @else {
        <h1 class="text-2xl font-semibold">Et si les offres venaient à toi ?</h1>
        <p class="mt-2 text-text-secondary">
          Bientôt, Jobzz pourra surveiller les offres pour toi et t'envoyer les meilleures par mail
          (les <strong>automatisations</strong>). Cette fonctionnalité arrive très vite.
        </p>
        <div class="jz-card mt-6 flex items-start gap-3">
          <lucide-icon name="zap" [size]="20" class="mt-0.5 text-accent" />
          <p class="text-sm text-text-secondary">
            Pour l'instant, ton profil est prêt : tu pourras lancer ta recherche d'offres dès que
            l'onglet « Offres » sera activé. On te préviendra.
          </p>
        </div>
      }

      @if (error()) {
        <p class="jz-field-error mt-6">{{ error() }}</p>
      }

      <!-- Navigation -->
      <div class="mt-8 flex items-center justify-between">
        @if (step() > 1) {
          <button type="button" class="jz-btn-ghost" (click)="back()">
            <lucide-icon name="arrow-left" [size]="16" /> Retour
          </button>
        } @else {
          <span></span>
        }

        <div class="flex items-center gap-3">
          <button type="button" class="text-sm text-text-muted hover:text-text" (click)="skip()">
            {{ step() === 3 ? 'Plus tard' : 'Passer' }}
          </button>
          <button type="button" class="jz-btn-primary" [disabled]="saving()" (click)="next()">
            @if (saving()) {
              Enregistrement…
            } @else {
              {{ step() === 3 ? 'Terminer' : 'Continuer' }}
              <lucide-icon name="arrow-right" [size]="16" />
            }
          </button>
        </div>
      </div>
    </div>
  `,
})
export class OnboardingComponent {
  private readonly profileService = inject(ProfileService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly contractTypesList = CONTRACT_TYPES;
  readonly contractLabels = CONTRACT_LABELS;

  readonly step = signal(1);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  firstName = '';
  availableFrom = '';
  readonly jobTargets = signal<JobTarget[]>([]);
  readonly locations = signal<ProfileLocation[]>([]);
  readonly contractTypes = signal<ContractType[]>([]);
  readonly skills = signal<string[]>([]);

  readonly skillSuggestions = computed(() => suggestSkills(this.jobTargets().map((j) => j.label)));

  private loaded = false;

  constructor() {
    void this.prefill();
  }

  /** Pré-remplit depuis le profil éventuel (prénom déjà connu, etc.). */
  private async prefill(): Promise<void> {
    try {
      const p = await this.profileService.load();
      this.firstName = p.firstName ?? this.auth.user()?.firstName ?? '';
      this.availableFrom = p.availableFrom ?? '';
      this.jobTargets.set(p.jobTargets);
      this.locations.set(p.locations);
      this.contractTypes.set(p.contractTypes);
      this.skills.set(p.skills);
    } catch {
      // Profil pas encore créé : on part d'une page vierge.
    } finally {
      this.loaded = true;
    }
  }

  toggleContract(type: ContractType): void {
    this.contractTypes.update((types) =>
      types.includes(type) ? types.filter((t) => t !== type) : [...types, type],
    );
  }

  back(): void {
    this.step.update((s) => Math.max(1, s - 1));
  }

  async next(): Promise<void> {
    this.error.set(null);
    if (this.step() === 1) {
      this.step.set(2);
      return;
    }
    if (this.step() === 2) {
      // On enregistre le profil une fois les compétences choisies.
      if (await this.persist()) this.step.set(3);
      return;
    }
    await this.finish();
  }

  async skip(): Promise<void> {
    if (this.step() === 3) {
      await this.finish();
    } else {
      this.step.update((s) => s + 1);
    }
  }

  private async finish(): Promise<void> {
    if (this.loaded && !(await this.persist())) return;
    await this.router.navigateByUrl('/app');
  }

  /** Sauvegarde le profil (fusion avec l'existant via GET préalable). Renvoie le succès. */
  private async persist(): Promise<boolean> {
    this.saving.set(true);
    this.error.set(null);
    try {
      const existing = this.profileService.profile();
      const input: ProfileUpdateInput = {
        firstName: this.firstName,
        lastName: existing?.lastName ?? null,
        phone: existing?.phone ?? null,
        linkedinUrl: existing?.linkedinUrl ?? null,
        links: existing?.links ?? [],
        jobTargets: this.jobTargets(),
        skills: this.skills(),
        sectors: existing?.sectors ?? [],
        locations: this.locations(),
        remotePreference: existing?.remotePreference ?? null,
        educationLevel: existing?.educationLevel ?? null,
        educationField: existing?.educationField ?? null,
        availableFrom: this.availableFrom || null,
        contractTypes: this.contractTypes(),
        alternance: existing?.alternance ?? null,
        internship: existing?.internship ?? null,
        experienceLevel: existing?.experienceLevel ?? null,
      };
      await this.profileService.save(input);
      // Le prénom peut avoir changé : on rafraîchit l'utilisateur pour l'accueil.
      await this.auth.refresh();
      return true;
    } catch {
      this.error.set('Enregistrement impossible. Réessaie.');
      return false;
    } finally {
      this.saving.set(false);
    }
  }
}
