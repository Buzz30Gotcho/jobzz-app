import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  CONTRACT_TYPES,
  type CvOfferComparisonResult,
  type PublicOffer,
  type SearchResult,
} from '@jobzz/shared';
import { OffersService } from '../../../core/offers/offers.service';
import { ApplicationsService } from '../../../core/applications/applications.service';
import { CvService } from '../../../core/cv/cv.service';
import { errorMessage } from '../../auth/error-message';
import { OffresTabsComponent } from './offres-tabs.component';
import { OfferCardComponent } from './offer-card.component';
import { ModalComponent } from '../../../shared/modal.component';

/** Onglet « Rechercher » (CLAUDE.md §4.5) : recherche immédiate basée sur le profil, sans IA. */
@Component({
  selector: 'jz-recherche',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    LucideAngularModule,
    OffresTabsComponent,
    OfferCardComponent,
    ModalComponent,
  ],
  template: `
    <div class="mx-auto w-full max-w-6xl">
      <jz-offres-tabs />

      <!-- Filtres -->
      <div class="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
        <input class="jz-input" placeholder="Métier, mot-clé…" [(ngModel)]="motsCles" (keydown.enter)="search()" />
        <select class="jz-input" [(ngModel)]="contractType">
          <option value="">Tous contrats</option>
          @for (c of contractTypes; track c) { <option [value]="c">{{ c }}</option> }
        </select>
        <input class="jz-input w-24" type="number" min="0" max="200" [(ngModel)]="distance" placeholder="km" />
        <button type="button" class="jz-btn-primary" (click)="search()">Rechercher</button>
      </div>

      @if (result()?.offers?.length && isDemo()) {
        <div class="mt-4 rounded-field border border-warning/40 bg-surface-raised px-3 py-2 text-sm text-warning">
          Mode démo : offres fictives.
        </div>
      }
      @if (result()?.notice) {
        <div class="mt-4 rounded-field border border-border bg-surface-raised px-3 py-2 text-sm text-text-secondary">
          {{ result()?.notice }}
        </div>
      }

      @if (loading()) {
        <div class="mt-6 space-y-3">
          <div class="h-28 animate-pulse rounded-card bg-surface-raised"></div>
          <div class="h-28 animate-pulse rounded-card bg-surface-raised"></div>
        </div>
      } @else if (result()) {
        @if (result(); as r) {
        <div class="mt-6 flex items-center justify-between text-sm text-text-secondary">
          <span>{{ r.total }} offre{{ r.total > 1 ? 's' : '' }} te correspond{{ r.total > 1 ? 'ent' : '' }}</span>
          @if (r.dailyLimit !== null) {
            <span class="font-mono text-xs">Offres du jour : {{ r.viewed }} / {{ r.dailyLimit }}</span>
          }
        </div>

        @if (r.offers.length === 0) {
          <p class="jz-card mt-4 text-center text-sm text-text-secondary">
            Aucune offre pour ces critères. Élargis le rayon ou change de mot-clé.
          </p>
        } @else {
          <ul class="mt-4 space-y-3">
            @for (offer of r.offers; track offer.id; let idx = $index) {
              @if (offer.locked && !previousLocked(idx)) {
                <li class="rounded-card border border-accent/40 bg-accent-bg/30 p-4 text-sm">
                  Tu as vu tes {{ r.dailyLimit }} meilleures offres du jour.
                  <strong>{{ r.remainingMatches }}</strong> autre{{ r.remainingMatches > 1 ? 's' : '' }}
                  te correspond{{ r.remainingMatches > 1 ? 'ent' : '' }} encore. Reviens demain, ou passe Premium
                  pour toutes les voir.
                </li>
              }
              <li>
                <jz-offer-card
                  [offer]="offer"
                  [rank]="idx + 1"
                  (open)="openDetail(offer)"
                  (apply)="startApply(offer)"
                  (hide)="hideOffer(offer)"
                />
              </li>
            }
          </ul>
        }
        }
      }
    </div>

    <!-- Détail de l'offre -->
    @if (detail(); as o) {
      <jz-modal [title]="o.title" (closed)="detail.set(null)">
        <p class="text-sm text-text-secondary">{{ o.companyName }} · {{ o.locationLabel }}</p>
        <div class="mt-3 font-mono text-sm text-accent">{{ o.score }}% · {{ o.scoreLabel }}</div>
        @if (o.skills.length) {
          <div class="mt-3 flex flex-wrap gap-2">
            @for (s of o.skills; track s) {
              <span class="rounded-full bg-accent-bg px-2.5 py-1 text-xs">{{ s }}</span>
            }
          </div>
        }
        <p class="mt-4 whitespace-pre-line text-sm text-text-secondary">{{ o.description }}</p>
        <div class="mt-5 flex gap-2">
          <a class="jz-btn-primary" [href]="o.url" target="_blank" rel="noopener">Voir l'offre</a>
          <button type="button" class="jz-btn-ghost" (click)="startApply(o); detail.set(null)">J'ai postulé</button>
        </div>

        <!-- Comparaison CV ↔ offre (CLAUDE.md §4.8) -->
        <div class="mt-5 border-t border-border pt-4">
          @if (!comparison()) {
            <button type="button" class="jz-btn-ghost" [disabled]="comparing()" (click)="compare(o)">
              <lucide-icon name="file-search" [size]="16" />
              {{ comparing() ? 'Comparaison…' : 'Comparer avec mon CV' }}
            </button>
            @if (compareError() === 'NO_CV') {
              <p class="mt-3 text-sm text-text-secondary">
                Dépose ton CV pour le comparer à cette offre.
                <a routerLink="/app/profil/cv" class="text-accent hover:underline">Déposer mon CV</a>
              </p>
            } @else if (compareError()) {
              <p class="mt-3 text-sm text-danger">{{ compareError() }}</p>
            }
          } @else {
            <h3 class="font-display text-sm font-semibold">Ton CV face à cette offre</h3>

            <!-- Ce qui colle -->
            <p class="mt-3 text-xs font-medium text-text-muted">Ce qui colle</p>
            @if (inCv().length) {
              <div class="mt-1 flex flex-wrap gap-2">
                @for (s of inCv(); track s.skill) {
                  <span class="rounded-full bg-accent-bg px-2.5 py-1 text-xs text-accent">{{ s.skill }}</span>
                }
              </div>
            } @else {
              <p class="mt-1 text-sm text-text-secondary">Rien de ton CV ne ressort directement.</p>
            }

            <!-- Ce qui manque -->
            <p class="mt-4 text-xs font-medium text-text-muted">Ce qui manque</p>
            <div class="mt-1 space-y-1">
              @for (s of toAdd(); track s.skill) {
                <p class="text-sm">
                  <span class="text-warning">{{ s.skill }}</span>
                  <span class="text-text-muted"> — dans ton profil, à ajouter au CV</span>
                </p>
              }
              @for (s of absentSkills(); track s.skill) {
                <p class="text-sm">
                  <span class="text-warning">{{ s.skill }}</span>
                  <span class="text-text-muted"> — absente</span>
                </p>
              }
              @if (comparison()!.rules.missingKeywords.length) {
                <p class="text-sm text-text-secondary">
                  Mots de l'offre absents : {{ comparison()!.rules.missingKeywords.join(', ') }}.
                </p>
              }
              @if (!toAdd().length && !absentSkills().length && !comparison()!.rules.missingKeywords.length) {
                <p class="text-sm text-text-secondary">Rien ne manque, beau match !</p>
              }
            </div>

            <!-- Ce que tu peux faire -->
            @if (comparison()!.rules.advice.length) {
              <p class="mt-4 text-xs font-medium text-text-muted">Ce que tu peux faire</p>
              <ul class="mt-1 list-disc space-y-1 pl-5">
                @for (a of comparison()!.rules.advice; track $index) {
                  <li class="text-sm text-text-secondary">{{ a }}</li>
                }
              </ul>
            }

            <!-- Conseils IA (Premium, CLAUDE.md §4.8) -->
            <div class="mt-5 border-t border-border pt-4">
              <div class="flex items-center justify-between gap-2">
                <h4 class="font-display text-sm font-semibold">Conseils de l'IA</h4>
                <span class="rounded-full bg-accent-bg px-2 py-0.5 font-mono text-xs text-accent">✨ IA</span>
              </div>
              @if (comparison()!.ai; as a) {
                <ul class="mt-2 list-disc space-y-1 pl-5">
                  @for (t of a.tips; track $index) {
                    <li class="text-sm text-text-secondary">{{ t }}</li>
                  }
                </ul>
                @if (a.rewrites?.length) {
                  <div class="mt-3 space-y-3">
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
                <button type="button" class="jz-btn-ghost mt-2" [disabled]="advising()" (click)="compareAiAdvice(o)">
                  <lucide-icon name="sparkles" [size]="16" />
                  {{ advising() ? 'Conseils IA…' : 'Conseils IA pour adapter mon CV' }}
                </button>
                @if (aiAdviceError()) {
                  <p class="mt-2 text-sm text-danger">{{ aiAdviceError() }}</p>
                }
              }
            </div>
          }
        </div>
      </jz-modal>
    }

    <!-- J'ai postulé : email facultatif -->
    @if (applying(); as o) {
      <jz-modal [title]="'J\\'ai postulé chez ' + (o.companyName ?? 'cette entreprise')" (closed)="applying.set(null)">
        <p class="text-sm text-text-secondary">
          On te rappellera de relancer dans 7 jours. Ajoute l'email du recruteur si tu l'as (facultatif).
        </p>
        <input class="jz-input mt-3" type="email" placeholder="Email du recruteur (facultatif)" [(ngModel)]="applyEmail" />
        <div class="mt-4 flex gap-2">
          <button type="button" class="jz-btn-primary" [disabled]="savingApply()" (click)="confirmApply(o)">
            {{ savingApply() ? 'Enregistrement…' : 'Noter ma candidature' }}
          </button>
          <button type="button" class="jz-btn-ghost" (click)="confirmApply(o)">Passer</button>
        </div>
        @if (applyNote()) { <p class="mt-3 text-sm text-accent">{{ applyNote() }}</p> }
      </jz-modal>
    }
  `,
})
export class RechercheComponent implements OnInit {
  private readonly offers = inject(OffersService);
  private readonly applications = inject(ApplicationsService);
  private readonly cv = inject(CvService);

  readonly contractTypes = CONTRACT_TYPES;
  motsCles = '';
  contractType = '';
  distance: number | null = null;

  readonly result = signal<SearchResult | null>(null);
  readonly loading = signal(true);
  readonly detail = signal<PublicOffer | null>(null);
  readonly applying = signal<PublicOffer | null>(null);
  applyEmail = '';
  readonly savingApply = signal(false);
  readonly applyNote = signal<string | null>(null);

  readonly isDemo = computed(() => this.result()?.offers.some((o) => o.isDemo) ?? false);

  // ── Comparaison CV ↔ offre ──
  readonly comparing = signal(false);
  readonly comparison = signal<CvOfferComparisonResult | null>(null);
  readonly compareError = signal<string | null>(null);

  readonly inCv = computed(
    () => this.comparison()?.rules.skills.filter((s) => s.presence === 'in_cv') ?? [],
  );
  readonly toAdd = computed(
    () => this.comparison()?.rules.skills.filter((s) => s.presence === 'in_profile_not_cv') ?? [],
  );
  readonly absentSkills = computed(
    () => this.comparison()?.rules.skills.filter((s) => s.presence === 'absent') ?? [],
  );

  /** Ouvre le détail d'une offre et remet à zéro l'état de comparaison. */
  openDetail(offer: PublicOffer): void {
    this.comparison.set(null);
    this.compareError.set(null);
    this.comparing.set(false);
    this.aiAdviceError.set(null);
    this.advising.set(false);
    this.detail.set(offer);
  }

  async compare(offer: PublicOffer): Promise<void> {
    if (this.comparing()) return;
    this.compareError.set(null);
    this.comparing.set(true);
    try {
      this.comparison.set(await this.cv.compare(offer.id));
    } catch (err) {
      const msg = errorMessage(err, 'Comparaison impossible pour le moment.');
      this.compareError.set(msg === 'NO_CV' ? 'NO_CV' : msg);
    } finally {
      this.comparing.set(false);
    }
  }

  // ── Conseils IA pour adapter le CV à l'offre (Premium) ──
  readonly advising = signal(false);
  readonly aiAdviceError = signal<string | null>(null);

  async compareAiAdvice(offer: PublicOffer): Promise<void> {
    if (this.advising()) return;
    this.aiAdviceError.set(null);
    this.advising.set(true);
    try {
      this.comparison.set(await this.cv.compareAi(offer.id));
    } catch (err) {
      const msg = errorMessage(err, 'Conseils IA impossibles pour le moment.');
      this.aiAdviceError.set(
        msg === 'AI_UNAVAILABLE' ? 'L’IA est indisponible pour le moment, réessaie plus tard.' : msg,
      );
    } finally {
      this.advising.set(false);
    }
  }

  copy(text: string): void {
    void navigator.clipboard?.writeText(text);
  }

  async ngOnInit(): Promise<void> {
    await this.search();
  }

  async search(): Promise<void> {
    this.loading.set(true);
    try {
      this.result.set(
        await this.offers.search({
          motsCles: this.motsCles || undefined,
          contractType: this.contractType || undefined,
          distance: this.distance ?? undefined,
        }),
      );
    } finally {
      this.loading.set(false);
    }
  }

  /** Vrai si l'offre précédente est déjà floutée (pour n'afficher l'encadré qu'une fois). */
  previousLocked(index: number): boolean {
    const offers = this.result()?.offers ?? [];
    return index > 0 && offers[index - 1].locked;
  }

  startApply(offer: PublicOffer): void {
    this.applyEmail = '';
    this.applyNote.set(null);
    this.applying.set(offer);
  }

  async confirmApply(offer: PublicOffer): Promise<void> {
    if (this.savingApply()) return;
    this.savingApply.set(true);
    try {
      const { duplicate } = await this.offers.applied(offer.id, this.applyEmail || undefined);
      this.applyNote.set(duplicate ? 'Candidature déjà suivie.' : 'Candidature notée !');
      this.removeOffer(offer.id);
      await this.applications.due();
      setTimeout(() => this.applying.set(null), 800);
    } finally {
      this.savingApply.set(false);
    }
  }

  async hideOffer(offer: PublicOffer): Promise<void> {
    await this.offers.hide(offer.id);
    this.removeOffer(offer.id);
  }

  private removeOffer(id: string): void {
    const r = this.result();
    if (!r) return;
    this.result.set({ ...r, offers: r.offers.filter((o) => o.id !== id), total: Math.max(0, r.total - 1) });
  }
}
