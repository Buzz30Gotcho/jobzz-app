import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import type { CvProfileExtract, CvRulesAnalysis, CvStatus } from '@jobzz/shared';
import { CvService } from '../../../core/cv/cv.service';
import { ProfileService } from '../../../core/profile/profile.service';
import { ProfilTabsComponent } from './profil-tabs.component';
import { errorMessage } from '../../auth/error-message';

/** Section « Mon CV » du Profil (CLAUDE.md §4.8) : dépôt PDF, analyse par règles, suppression. */
@Component({
  selector: 'jz-cv',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, ProfilTabsComponent],
  template: `
    <div class="mx-auto w-full max-w-3xl">
      <h1 class="text-2xl font-semibold">Profil</h1>
      <jz-profil-tabs />

      <div class="mt-6">
        @if (loading()) {
          <div class="jz-card animate-pulse"><div class="h-24"></div></div>
        } @else if (status()?.hasCv) {
          <!-- CV déposé -->
          <div class="jz-card">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <lucide-icon name="file-text" [size]="20" class="text-accent" />
                <div>
                  <p class="font-medium">Ton CV est déposé</p>
                  <p class="text-xs text-text-muted">Analysé le {{ uploadedLabel() }}</p>
                </div>
              </div>
              <button type="button" class="text-xs text-danger hover:underline" (click)="remove()">
                Supprimer mon CV
              </button>
            </div>
          </div>

          @if (rules(); as r) {
            <div class="jz-card mt-4">
              <div class="flex items-center gap-4">
                <div
                  class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-accent font-mono text-xl font-medium"
                >
                  {{ r.score }}
                </div>
                <div>
                  <p class="font-medium">{{ scoreLabel(r.score) }}</p>
                  <p class="text-sm text-text-secondary">
                    {{ warnCount(r) }} point(s) à améliorer sur {{ r.tips.length }}.
                  </p>
                </div>
              </div>

              <ul class="mt-5 space-y-3">
                @for (tip of r.tips; track $index) {
                  <li class="flex gap-3">
                    <lucide-icon
                      [name]="tip.level === 'ok' ? 'check-circle-2' : 'alert-triangle'"
                      [size]="18"
                      [class]="tip.level === 'ok' ? 'mt-0.5 shrink-0 text-accent' : 'mt-0.5 shrink-0 text-warning'"
                    />
                    <div>
                      <p class="text-sm">{{ tip.message }}</p>
                      @if (tip.action) {
                        <p class="text-xs text-text-muted">{{ tip.action }}</p>
                      }
                    </div>
                  </li>
                }
              </ul>
            </div>
          } @else {
            <div class="jz-card mt-4">
              <p class="text-sm text-text-secondary">
                Ton CV est déposé mais n'a pas encore été analysé (limite d'analyses atteinte ce mois-ci).
              </p>
            </div>
          }

          <!-- Analyse par l'IA (Premium, CLAUDE.md §4.8) -->
          <div class="jz-card mt-4">
            <div class="flex items-center justify-between gap-2">
              <h2 class="font-display text-sm font-semibold">Analyse par l'IA</h2>
              <span class="rounded-full bg-accent-bg px-2 py-0.5 font-mono text-xs text-accent">✨ IA</span>
            </div>
            @if (ai(); as a) {
              <p class="mt-3 text-sm text-text-secondary">{{ a.overall }}</p>
              <p class="mt-4 text-xs font-medium text-text-muted">Points forts</p>
              <ul class="mt-1 space-y-1">
                @for (s of a.strengths; track $index) {
                  <li class="text-sm">• {{ s }}</li>
                }
              </ul>
              <p class="mt-4 text-xs font-medium text-text-muted">À améliorer</p>
              <ul class="mt-1 space-y-1">
                @for (s of a.improvements; track $index) {
                  <li class="text-sm">• {{ s }}</li>
                }
              </ul>
              @if (a.rewrites?.length) {
                <p class="mt-4 text-xs font-medium text-text-muted">Reformulations proposées</p>
                <div class="mt-2 space-y-3">
                  @for (r of a.rewrites; track $index) {
                    <div class="rounded-field border border-border p-3">
                      <p class="text-xs text-text-muted line-through">{{ r.before }}</p>
                      <p class="mt-1 text-sm">{{ r.after }}</p>
                      <button type="button" class="mt-2 text-xs text-accent hover:underline" (click)="copy(r.after)">
                        Copier
                      </button>
                    </div>
                  }
                </div>
              }
            } @else {
              <p class="mt-2 text-sm text-text-secondary">
                Un regard de l'IA : ressenti global, points forts, améliorations et reformulations.
              </p>
              <button type="button" class="jz-btn-ghost mt-3" [disabled]="analyzingAi()" (click)="analyzeAi()">
                <lucide-icon name="sparkles" [size]="16" />
                {{ analyzingAi() ? 'Analyse IA…' : 'Analyser avec l’IA' }}
              </button>
              @if (aiError()) {
                <p class="mt-3 text-sm text-danger">{{ aiError() }}</p>
              }
            }
          </div>

          <!-- Pré-remplir le profil depuis le CV (CLAUDE.md §4.8) -->
          <div class="jz-card mt-4">
            <h2 class="font-display text-sm font-semibold">Pré-remplir mon profil</h2>
            <p class="mt-1 text-sm text-text-secondary">
              On repère dans ton CV ce qui peut compléter ton profil. Tu valides ce que tu gardes.
            </p>
            @if (!extract()) {
              <button type="button" class="jz-btn-ghost mt-3" [disabled]="extracting()" (click)="extractProfile()">
                <lucide-icon name="wand-sparkles" [size]="16" />
                {{ extracting() ? 'Lecture du CV…' : 'Lire mon CV' }}
              </button>
              @if (extractError()) {
                <p class="mt-3 text-sm text-danger">{{ extractError() }}</p>
              }
            } @else {
              @if (extract()!.skills.length) {
                @if (pendingSkills().length) {
                  <p class="mt-3 text-xs font-medium text-text-muted">
                    Compétences repérées dans ton CV — ajoute à ton profil celles que tu veux garder :
                  </p>
                  <div class="mt-1 flex flex-wrap gap-2">
                    @for (s of pendingSkills(); track s) {
                      <button
                        type="button"
                        (click)="toggleSkill(s)"
                        [class]="
                          isSelected(s)
                            ? 'rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-ink'
                            : 'rounded-full border border-border px-3 py-1 text-xs text-text-secondary hover:text-text'
                        "
                      >
                        {{ s }}
                      </button>
                    }
                  </div>
                  @if (selectedSkills().length) {
                    <button
                      type="button"
                      class="jz-btn-primary mt-3"
                      [disabled]="addingSkills()"
                      (click)="addSkills()"
                    >
                      {{ addingSkills() ? 'Ajout…' : 'Ajouter ' + selectedSkills().length + ' compétence(s) à mon profil' }}
                    </button>
                  }
                }
                @if (addedNote()) {
                  <div class="mt-3 flex flex-wrap items-center gap-2 rounded-field bg-accent-bg px-3 py-2 text-sm text-accent">
                    <lucide-icon name="check-circle-2" [size]="16" />
                    <span>{{ addedNote() }}</span>
                    <a routerLink="/app/profil" class="font-medium underline hover:no-underline">Voir dans mon profil</a>
                  </div>
                }
              } @else {
                <p class="mt-3 text-sm text-text-secondary">Aucune compétence connue détectée automatiquement.</p>
              }

              @if (extract()!.jobLabel || extract()!.city || extract()!.educationLevel) {
                <p class="mt-4 text-xs font-medium text-text-muted">Autres infos repérées</p>
                <ul class="mt-1 space-y-1 text-sm text-text-secondary">
                  @if (extract()!.jobLabel) {
                    <li>Métier : {{ extract()!.jobLabel }}</li>
                  }
                  @if (extract()!.city) {
                    <li>Ville : {{ extract()!.city }}</li>
                  }
                  @if (extract()!.educationLevel) {
                    <li>Niveau d'études : {{ extract()!.educationLevel }}</li>
                  }
                </ul>
                <p class="mt-1 text-xs text-text-muted">
                  À valider dans
                  <a routerLink="/app/profil" class="text-accent hover:underline">Mes infos</a>
                  (métier et ville doivent être résolus pour la recherche).
                </p>
              }
              @if (!extract()!.aiUsed) {
                <p class="mt-3 text-xs text-text-muted">
                  IA indisponible : compétences détectées par règles uniquement.
                </p>
              }
            }
          </div>

          <label class="jz-btn-ghost mt-4 cursor-pointer">
            <lucide-icon name="upload" [size]="16" /> Remplacer mon CV
            <input type="file" accept="application/pdf" class="hidden" (change)="onFile($event)" />
          </label>
        } @else {
          <!-- Pas de CV -->
          <div class="jz-card">
            <h2 class="text-lg font-semibold">Dépose ton CV</h2>
            <p class="mt-1 text-sm text-text-secondary">
              On l'analyse pour te donner des conseils concrets, et tu pourras le comparer aux offres.
            </p>
            <label class="jz-btn-primary mt-4 inline-flex cursor-pointer">
              <lucide-icon name="upload" [size]="16" /> Choisir un PDF
              <input type="file" accept="application/pdf" class="hidden" (change)="onFile($event)" />
            </label>
            <p class="mt-3 text-xs text-text-muted">
              PDF, 5 Mo maximum. Le fichier est analysé puis supprimé : on ne garde que le texte,
              nécessaire pour comparer ton CV aux offres.
            </p>
          </div>
        }

        @if (uploading()) {
          <p class="mt-4 text-sm text-text-secondary">Analyse en cours…</p>
        }
        @if (error()) {
          <p class="mt-4 text-sm text-danger">{{ error() }}</p>
        }
      </div>
    </div>
  `,
})
export class CvComponent implements OnInit {
  private readonly cv = inject(CvService);
  private readonly profile = inject(ProfileService);

  readonly status = signal<CvStatus | null>(null);
  readonly loading = signal(true);
  readonly uploading = signal(false);
  readonly error = signal<string | null>(null);

  readonly rules = computed(() => this.status()?.rules ?? null);
  readonly ai = computed(() => this.status()?.ai ?? null);
  readonly analyzingAi = signal(false);
  readonly aiError = signal<string | null>(null);

  // ── Pré-remplissage du profil depuis le CV ──
  readonly extract = signal<CvProfileExtract | null>(null);
  readonly extracting = signal(false);
  readonly extractError = signal<string | null>(null);
  readonly selectedSkills = signal<string[]>([]);
  readonly addingSkills = signal(false);
  readonly addedNote = signal<string | null>(null);
  /** Compétences déjà ajoutées au profil pendant cette session (retour visuel). */
  readonly addedSkills = signal<string[]>([]);
  /** Compétences détectées qui restent à ajouter (les ajoutées quittent la liste). */
  readonly pendingSkills = computed(() =>
    (this.extract()?.skills ?? []).filter((s) => !this.addedSkills().includes(s)),
  );
  readonly uploadedLabel = computed(() => {
    const d = this.status()?.uploadedAt;
    return d ? new Date(d).toLocaleDateString('fr-FR') : '';
  });

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  private async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      this.status.set(await this.cv.status());
    } catch {
      this.error.set('Impossible de charger ton CV.');
    } finally {
      this.loading.set(false);
    }
  }

  async onFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // permet de redéposer le même fichier
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.error.set('CV trop volumineux (5 Mo maximum).');
      return;
    }
    this.error.set(null);
    this.uploading.set(true);
    try {
      this.status.set(await this.cv.upload(file));
    } catch (err) {
      this.error.set(errorMessage(err, 'Dépôt impossible. Réessaie.'));
    } finally {
      this.uploading.set(false);
    }
  }

  async remove(): Promise<void> {
    if (!confirm('Supprimer ton CV et ses analyses ?')) return;
    this.error.set(null);
    try {
      await this.cv.remove();
      this.status.set({ hasCv: false, uploadedAt: null, rules: null, ai: null });
    } catch {
      this.error.set('Suppression impossible. Réessaie.');
    }
  }

  async analyzeAi(): Promise<void> {
    if (this.analyzingAi()) return;
    this.aiError.set(null);
    this.analyzingAi.set(true);
    try {
      this.status.set(await this.cv.analyzeAi());
    } catch (err) {
      const msg = errorMessage(err, 'Analyse IA impossible.');
      this.aiError.set(
        msg === 'AI_UNAVAILABLE' ? 'L’IA est indisponible pour le moment, réessaie plus tard.' : msg,
      );
    } finally {
      this.analyzingAi.set(false);
    }
  }

  copy(text: string): void {
    void navigator.clipboard?.writeText(text);
  }

  async extractProfile(): Promise<void> {
    if (this.extracting()) return;
    this.extractError.set(null);
    this.addedNote.set(null);
    this.extracting.set(true);
    try {
      const result = await this.cv.extractProfile();
      this.extract.set(result);
      this.selectedSkills.set([...result.skills]); // tout présélectionné
    } catch {
      this.extractError.set('Lecture du CV impossible pour le moment.');
    } finally {
      this.extracting.set(false);
    }
  }

  isSelected(skill: string): boolean {
    return this.selectedSkills().includes(skill);
  }

  toggleSkill(skill: string): void {
    const current = this.selectedSkills();
    this.selectedSkills.set(
      current.includes(skill) ? current.filter((s) => s !== skill) : [...current, skill],
    );
  }

  async addSkills(): Promise<void> {
    const skills = this.selectedSkills();
    if (!skills.length || this.addingSkills()) return;
    this.addingSkills.set(true);
    try {
      await this.profile.addSkills(skills);
      // Retour visuel : on marque les compétences ajoutées et on vide la sélection.
      this.addedSkills.update((a) => [...new Set([...a, ...skills])]);
      this.selectedSkills.set([]);
      this.addedNote.set(`${skills.length} compétence(s) ajoutée(s) à ton profil.`);
    } catch {
      this.addedNote.set('Ajout impossible. Réessaie.');
    } finally {
      this.addingSkills.set(false);
    }
  }

  warnCount(r: CvRulesAnalysis): number {
    return r.tips.filter((t) => t.level === 'warn').length;
  }

  scoreLabel(score: number): string {
    if (score >= 80) return 'Très bon CV';
    if (score >= 60) return 'Bon CV, quelques améliorations';
    if (score >= 40) return 'CV à renforcer';
    return 'CV à retravailler';
  }
}
