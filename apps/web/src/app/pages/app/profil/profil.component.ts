import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  CONTRACT_TYPES,
  EXPERIENCE_LEVELS,
  REMOTE_PREFERENCES,
  suggestSkills,
  type ContractType,
  type ExperienceLevel,
  type JobTarget,
  type ProfileLocation,
  type ProfileUpdateInput,
  type PublicProfile,
  type RemotePreference,
} from '@jobzz/shared';
import { ProfileService } from '../../../core/profile/profile.service';
import { MetierFieldComponent } from '../../../shared/metier-field.component';
import { CommuneFieldComponent } from '../../../shared/commune-field.component';
import { TagsFieldComponent } from '../../../shared/tags-field.component';

const CONTRACT_LABELS: Record<ContractType, string> = {
  alternance: 'Alternance',
  stage: 'Stage',
  cdd: 'CDD',
  cdi: 'CDI',
};
const REMOTE_LABELS: Record<RemotePreference, string> = {
  indifferent: 'Indifférent',
  accepte: 'Accepté',
  souhaite: 'Souhaité',
  exclu: 'Exclu',
};
const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  debutant: 'Débutant',
  moins_1_an: 'Moins de 1 an',
  '1_a_3_ans': '1 à 3 ans',
  plus_3_ans: 'Plus de 3 ans',
};

@Component({
  selector: 'jz-profil',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    RouterLinkActive,
    LucideAngularModule,
    MetierFieldComponent,
    CommuneFieldComponent,
    TagsFieldComponent,
  ],
  templateUrl: './profil.component.html',
})
export class ProfilComponent {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);

  readonly contractTypesList = CONTRACT_TYPES;
  readonly contractLabels = CONTRACT_LABELS;
  readonly remotePreferences = REMOTE_PREFERENCES;
  readonly remoteLabels = REMOTE_LABELS;
  readonly experienceLevels = EXPERIENCE_LEVELS;
  readonly experienceLabels = EXPERIENCE_LABELS;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly error = signal<string | null>(null);
  readonly completion = signal<PublicProfile['completion'] | null>(null);

  // Champs « liste » gérés en signals (composants sur mesure).
  readonly jobTargets = signal<JobTarget[]>([]);
  readonly locations = signal<ProfileLocation[]>([]);
  readonly skills = signal<string[]>([]);
  readonly sectors = signal<string[]>([]);
  readonly links = signal<string[]>([]);
  readonly contractTypes = signal<ContractType[]>([]);

  /** Suggestions de compétences recalculées selon les métiers visés. */
  readonly skillSuggestions = computed(() => suggestSkills(this.jobTargets().map((j) => j.label)));

  readonly showAlternance = computed(() => this.contractTypes().includes('alternance'));
  readonly showInternship = computed(() => this.contractTypes().includes('stage'));
  readonly showExperience = computed(
    () => this.contractTypes().includes('cdd') || this.contractTypes().includes('cdi'),
  );

  readonly form = this.fb.nonNullable.group({
    firstName: '',
    lastName: '',
    phone: '',
    linkedinUrl: '',
    remotePreference: '' as RemotePreference | '',
    educationLevel: '',
    educationField: '',
    experienceLevel: '' as ExperienceLevel | '',
    availableFrom: '',
    alternanceRythme: '',
    alternanceDureeMois: null as number | null,
    alternanceEcole: '',
    internshipDureeMois: null as number | null,
    internshipPeriode: '',
  });

  constructor() {
    void this.init();
  }

  private async init(): Promise<void> {
    try {
      const profile = await this.profileService.load();
      this.patch(profile);
    } catch {
      this.error.set('Impossible de charger ton profil. Réessaie.');
    } finally {
      this.loading.set(false);
    }
  }

  private patch(p: PublicProfile): void {
    this.form.patchValue({
      firstName: p.firstName ?? '',
      lastName: p.lastName ?? '',
      phone: p.phone ?? '',
      linkedinUrl: p.linkedinUrl ?? '',
      remotePreference: p.remotePreference ?? '',
      educationLevel: p.educationLevel ?? '',
      educationField: p.educationField ?? '',
      experienceLevel: p.experienceLevel ?? '',
      availableFrom: p.availableFrom ?? '',
      alternanceRythme: p.alternance?.rythme ?? '',
      alternanceDureeMois: p.alternance?.dureeMois ?? null,
      alternanceEcole: p.alternance?.ecole ?? '',
      internshipDureeMois: p.internship?.dureeMois ?? null,
      internshipPeriode: p.internship?.periode ?? '',
    });
    this.jobTargets.set(p.jobTargets);
    this.locations.set(p.locations);
    this.skills.set(p.skills);
    this.sectors.set(p.sectors);
    this.links.set(p.links);
    this.contractTypes.set(p.contractTypes);
    this.completion.set(p.completion);
  }

  toggleContract(type: ContractType): void {
    this.contractTypes.update((types) =>
      types.includes(type) ? types.filter((t) => t !== type) : [...types, type],
    );
  }

  async save(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.saved.set(false);
    this.error.set(null);
    const v = this.form.getRawValue();

    const input: ProfileUpdateInput = {
      firstName: v.firstName,
      lastName: v.lastName,
      phone: v.phone,
      linkedinUrl: v.linkedinUrl,
      links: this.links(),
      jobTargets: this.jobTargets(),
      skills: this.skills(),
      sectors: this.sectors(),
      locations: this.locations(),
      remotePreference: v.remotePreference || null,
      educationLevel: v.educationLevel,
      educationField: v.educationField,
      availableFrom: v.availableFrom || null,
      contractTypes: this.contractTypes(),
      alternance: this.showAlternance()
        ? { rythme: v.alternanceRythme, dureeMois: v.alternanceDureeMois, ecole: v.alternanceEcole }
        : null,
      internship: this.showInternship()
        ? { dureeMois: v.internshipDureeMois, periode: v.internshipPeriode }
        : null,
      experienceLevel: v.experienceLevel || null,
    };

    try {
      const updated = await this.profileService.save(input);
      this.completion.set(updated.completion);
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 2500);
    } catch {
      this.error.set('Enregistrement impossible. Vérifie tes champs (ex. lien LinkedIn) et réessaie.');
    } finally {
      this.saving.set(false);
    }
  }
}
