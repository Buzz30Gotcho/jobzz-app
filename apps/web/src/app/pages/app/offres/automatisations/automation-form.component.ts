import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  AUTOMATION_SCHEMA_VERSION,
  CONTRACT_TYPES,
  REMOTE_CRITERIA,
  type AutomationCriteria,
  type AutomationPreview,
  type ContractType,
  type JobTarget,
  type ProfileLocation,
} from '@jobzz/shared';
import { AutomationsService } from '../../../../core/automations/automations.service';
import { ProfileService } from '../../../../core/profile/profile.service';
import { MetierFieldComponent } from '../../../../shared/metier-field.component';
import { CommuneFieldComponent } from '../../../../shared/commune-field.component';
import { TagsFieldComponent } from '../../../../shared/tags-field.component';

const CONTRACT_LABELS: Record<ContractType, string> = { alternance: 'Alternance', stage: 'Stage', cdd: 'CDD', cdi: 'CDI' };
const REMOTE_LABELS: Record<string, string> = {
  indifferent: 'Indifférent', accepte: 'Accepté', exige: 'Exigé (100%)', hybride_min: 'Hybride minimum', exclu: 'Exclu',
};

/**
 * Création / modification d'une automatisation (CLAUDE.md §4.6). Formulaire simple + « Plus de
 * critères », avec un aperçu (prévision + exemples) recalculé à la demande. Pré-rempli depuis le
 * profil. L'assistant IA « décris ce que tu cherches » arrive à la passe suivante.
 */
@Component({
  selector: 'jz-automation-form',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, MetierFieldComponent, CommuneFieldComponent, TagsFieldComponent],
  template: `
    <div class="mx-auto w-full max-w-6xl">
      <h1 class="text-2xl font-semibold">{{ id() ? 'Modifier' : 'Nouvelle' }} automatisation</h1>

      <div class="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <!-- Critères -->
        <div class="space-y-6">
          <div class="jz-card space-y-5">
            <div>
              <label class="jz-label" for="name">Nom</label>
              <input id="name" class="jz-input" [(ngModel)]="name" placeholder="Alternance dev à Montpellier" />
            </div>
            <div>
              <span class="jz-label">Métier(s)</span>
              <jz-metier-field [(value)]="metiers" />
            </div>
            <div>
              <span class="jz-label">Contrat(s)</span>
              <div class="flex flex-wrap gap-2">
                @for (c of contractTypes; track c) {
                  <button type="button" (click)="toggleContract(c)"
                    [class]="contrats().includes(c) ? activeChip : inactiveChip">{{ contractLabels[c] }}</button>
                }
              </div>
            </div>
            <div>
              <span class="jz-label">Lieu(x)</span>
              <jz-commune-field [(value)]="lieux" />
            </div>
            <div>
              <span class="jz-label">Compétences</span>
              <jz-tags-field [(value)]="competences" placeholder="Ajoute une compétence puis Entrée" />
            </div>
            <div>
              <label class="jz-label" for="dateDebut">Date de début (à partir de)</label>
              <input id="dateDebut" type="date" class="jz-input" [(ngModel)]="dateDebutDu" />
            </div>
          </div>

          <!-- Plus de critères -->
          <div class="jz-card">
            <button type="button" class="flex w-full items-center justify-between" (click)="more.set(!more())">
              <span class="font-medium">Plus de critères</span>
              <lucide-icon [name]="more() ? 'chevron-down' : 'chevron-right'" [size]="18" />
            </button>
            @if (more()) {
              <div class="mt-4 space-y-5">
                <div>
                  <span class="jz-label">Mots à éviter</span>
                  <jz-tags-field [(value)]="motsExclure" placeholder="Ex. régie, ESN…" />
                </div>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="jz-label" for="teletravail">Télétravail</label>
                    <select id="teletravail" class="jz-input" [(ngModel)]="teletravail">
                      @for (r of remoteCriteria; track r) { <option [value]="r">{{ remoteLabels[r] }}</option> }
                    </select>
                  </div>
                  <div>
                    <label class="jz-label" for="fraicheur">Fraîcheur (jours)</label>
                    <input id="fraicheur" type="number" min="1" max="60" class="jz-input" [(ngModel)]="fraicheurJours" />
                  </div>
                  <div>
                    <label class="jz-label" for="scoreMin">Score minimum</label>
                    <input id="scoreMin" type="number" min="0" max="100" class="jz-input" [(ngModel)]="scoreMin" />
                  </div>
                  <label class="flex items-center gap-2 pt-7 text-sm">
                    <input type="checkbox" [(ngModel)]="exclureEsn" /> Exclure les ESN
                  </label>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Aperçu -->
        <aside class="lg:sticky lg:top-6 h-fit">
          <div class="jz-card">
            <h2 class="font-semibold">Prévision</h2>
            @if (preview(); as p) {
              <p class="mt-2 font-mono text-2xl text-accent">~ {{ p.previsionParSemaine }}/sem.</p>
              <p class="text-xs text-text-muted">D'après les offres des 2 dernières semaines. Le nombre réel peut varier.</p>
              @if (p.examples.length) {
                <ul class="mt-4 space-y-2 text-sm">
                  @for (e of p.examples; track e.title) {
                    <li class="rounded-field border border-border p-2">
                      <span class="font-mono text-xs text-accent">{{ e.score }}%</span> {{ e.title }}
                      <span class="text-text-muted">· {{ e.companyName }}</span>
                    </li>
                  }
                </ul>
              } @else {
                <p class="mt-3 text-sm text-text-secondary">Aucune offre ces 2 dernières semaines avec ces critères. Élargis le rayon ou baisse le score minimum.</p>
              }
            } @else {
              <p class="mt-2 text-sm text-text-secondary">Clique sur « Aperçu » pour estimer.</p>
            }
            <button type="button" class="jz-btn-ghost mt-4 w-full" [disabled]="previewing()" (click)="runPreview()">
              {{ previewing() ? 'Calcul…' : 'Aperçu' }}
            </button>
            <button type="button" class="jz-btn-primary mt-2 w-full" [disabled]="saving()" (click)="save()">
              {{ saving() ? 'Enregistrement…' : id() ? 'Enregistrer' : 'Activer' }}
            </button>
            @if (error()) { <p class="jz-field-error mt-2">{{ error() }}</p> }
          </div>
        </aside>
      </div>
    </div>
  `,
})
export class AutomationFormComponent implements OnInit {
  private readonly service = inject(AutomationsService);
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);

  readonly id = input<string>();

  readonly contractTypes = CONTRACT_TYPES;
  readonly contractLabels = CONTRACT_LABELS;
  readonly remoteCriteria = REMOTE_CRITERIA;
  readonly remoteLabels = REMOTE_LABELS;
  readonly activeChip = 'rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-ink';
  readonly inactiveChip = 'rounded-full border border-border px-4 py-1.5 text-sm text-text-secondary hover:text-text';

  name = '';
  dateDebutDu = '';
  teletravail = 'indifferent';
  fraicheurJours = 14;
  scoreMin = 60;
  exclureEsn = false;
  readonly metiers = signal<JobTarget[]>([]);
  readonly lieux = signal<ProfileLocation[]>([]);
  readonly competences = signal<string[]>([]);
  readonly motsExclure = signal<string[]>([]);

  readonly more = signal(false);
  readonly preview = signal<AutomationPreview | null>(null);
  readonly previewing = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const id = this.id();
    if (id && id !== 'nouvelle') {
      const a = await this.service.get(id);
      this.name = a.name;
      this.applyCriteria(a.criteria);
    } else {
      // Pré-remplissage depuis le profil.
      const p = await this.profileService.load().catch(() => null);
      if (p) {
        this.metiers.set(p.jobTargets);
        this.lieux.set(p.locations);
        this.competences.set(p.skills);
        this.contrats.set(p.contractTypes);
        this.dateDebutDu = p.availableFrom ?? '';
        this.name = p.jobTargets[0] ? `Offres ${p.jobTargets[0].label}` : 'Mon automatisation';
      }
    }
  }

  readonly contrats = signal<ContractType[]>([]);
  toggleContract(c: ContractType): void {
    this.contrats.update((list) => (list.includes(c) ? list.filter((x) => x !== c) : [...list, c]));
  }

  private applyCriteria(c: AutomationCriteria): void {
    this.metiers.set(c.metiers);
    this.lieux.set(c.lieux);
    this.competences.set(c.competences.map((s) => s.label));
    this.contrats.set(c.contrats);
    this.motsExclure.set(c.motsCles.exclure);
    this.dateDebutDu = c.dateDebutDu ?? '';
    this.teletravail = c.teletravail;
    this.fraicheurJours = c.fraicheurJours;
    this.scoreMin = c.scoreMin;
    this.exclureEsn = c.entreprise.exclureEsn;
  }

  private buildCriteria(): AutomationCriteria {
    return {
      schemaVersion: AUTOMATION_SCHEMA_VERSION,
      metiers: this.metiers(),
      motsCles: { inclure: [], indispensables: [], exclure: this.motsExclure() },
      contrats: this.contrats(),
      alternanceRythme: null,
      stageDureeMin: null,
      stageDureeMax: null,
      lieux: this.lieux(),
      teletravail: this.teletravail as AutomationCriteria['teletravail'],
      dateDebutDu: this.dateDebutDu || null,
      dateDebutAu: null,
      experienceMax: null,
      competences: this.competences().map((label) => ({ label, niveau: 'souhaitee' as const })),
      entreprise: { tailles: [], types: [], secteursInclure: [], secteursExclure: [], exclureNoms: [], exclureEsn: this.exclureEsn },
      salaireMin: null,
      fraicheurJours: Number(this.fraicheurJours) || 14,
      scoreMin: Number(this.scoreMin) || 60,
      remotePreference: null,
    };
  }

  async runPreview(): Promise<void> {
    this.previewing.set(true);
    try {
      this.preview.set(await this.service.preview(this.buildCriteria()));
    } catch {
      this.error.set('Aperçu impossible pour le moment.');
    } finally {
      this.previewing.set(false);
    }
  }

  async save(): Promise<void> {
    if (this.saving()) return;
    if (!this.name.trim()) {
      this.error.set('Donne un nom à ton automatisation.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    try {
      const input = { name: this.name, criteria: this.buildCriteria() };
      const id = this.id();
      if (id && id !== 'nouvelle') await this.service.update(id, input);
      else await this.service.create(input);
      await this.router.navigateByUrl('/app/offres/automatisations');
    } catch {
      this.error.set('Enregistrement impossible (limite d\'automatisations atteinte ?).');
    } finally {
      this.saving.set(false);
    }
  }
}
