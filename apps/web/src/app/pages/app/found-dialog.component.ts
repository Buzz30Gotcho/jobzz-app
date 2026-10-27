import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CONTRACT_TYPES,
  HELPFULNESS_VALUES,
  type ContractType,
  type Helpfulness,
} from '@jobzz/shared';
import { ModalComponent } from '../../shared/modal.component';
import { OutcomesService } from '../../core/outcomes/outcomes.service';

const CONTRACT_LABELS: Record<ContractType, string> = {
  alternance: 'Alternance',
  stage: 'Stage',
  cdd: 'CDD',
  cdi: 'CDI',
};

const HELPFULNESS_LABELS: Record<Helpfulness, string> = {
  beaucoup: 'Oui, beaucoup',
  un_peu: 'Un peu',
  pas_vraiment: 'Pas vraiment',
};

/**
 * « J'ai trouvé ! » (CLAUDE.md §4.9) : ce que l'utilisateur a décroché, puis félicitations,
 * pause des automatisations (facultative) et une seule question « Jobzz t'a aidé ? ».
 * L'événement n'est enregistré qu'au clic final (fermer = « je cherche encore »).
 */
@Component({
  selector: 'jz-found-dialog',
  standalone: true,
  imports: [FormsModule, ModalComponent],
  template: `
    <jz-modal [title]="step() === 'form' ? 'Tu as trouvé ?' : 'Bravo ' + buzz" (closed)="closed.emit()">
      @if (step() === 'form') {
        <p class="text-sm text-text-secondary">Qu'est-ce que tu as décroché ?</p>
        <div class="mt-3 flex flex-wrap gap-2">
          @for (c of contracts; track c) {
            <button
              type="button"
              (click)="contract.set(c)"
              class="rounded-field border px-4 py-2 text-sm transition-colors"
              [class.border-accent]="contract() === c"
              [class.text-accent]="contract() === c"
              [class.border-border]="contract() !== c"
              [class.text-text-secondary]="contract() !== c"
            >
              {{ contractLabels[c] }}
            </button>
          }
        </div>
        <label for="company" class="jz-label mt-4">Entreprise (facultatif)</label>
        <input id="company" class="jz-input" [(ngModel)]="company" maxlength="150" />
        <div class="mt-6 flex justify-end gap-3">
          <button type="button" class="jz-btn-ghost" (click)="closed.emit()">Annuler</button>
          <button type="button" class="jz-btn-primary" [disabled]="!contract()" (click)="step.set('celebrate')">
            Continuer
          </button>
        </div>
      } @else {
        <!-- Célébration : accent vert, discret et respectueux de prefers-reduced-motion. -->
        <div class="jz-celebrate text-center">
          <p class="text-4xl">🎉</p>
          <p class="mt-2 text-lg font-semibold">Génial, c'est une belle nouvelle !</p>
          <p class="text-sm text-text-secondary">Bravo pour ta {{ contractLabels[contract()!] }}.</p>
        </div>

        <div class="mt-5 rounded-card border border-border p-4">
          <p class="text-sm">Tu veux mettre tes automatisations en pause ?</p>
          <button type="button" class="jz-btn-ghost mt-3" [disabled]="pauseState() !== 'idle'" (click)="pause()">
            {{ pauseLabel() }}
          </button>
        </div>

        <div class="mt-5">
          <p class="text-sm font-medium">Jobzz t'a aidé à trouver ?</p>
          <div class="mt-2 flex flex-wrap gap-2">
            @for (h of helpfulnessValues; track h) {
              <button
                type="button"
                (click)="helpfulness.set(h)"
                class="rounded-field border px-3 py-1.5 text-sm transition-colors"
                [class.border-accent]="helpfulness() === h"
                [class.text-accent]="helpfulness() === h"
                [class.border-border]="helpfulness() !== h"
                [class.text-text-secondary]="helpfulness() !== h"
              >
                {{ helpfulnessLabels[h] }}
              </button>
            }
          </div>
          <textarea
            class="jz-input mt-3 min-h-20"
            [(ngModel)]="comment"
            maxlength="2000"
            placeholder="Un mot pour nous (facultatif)"
          ></textarea>
        </div>

        <div class="mt-6 flex items-center justify-between gap-3">
          <button type="button" class="text-sm text-text-muted hover:text-text" (click)="closed.emit()">
            Finalement, je cherche encore
          </button>
          <button type="button" class="jz-btn-primary" [disabled]="saving()" (click)="finish()">
            {{ saving() ? 'Enregistrement…' : 'Terminer' }}
          </button>
        </div>
      }
    </jz-modal>
  `,
  styles: [
    `
      .jz-celebrate {
        animation: jz-pop 250ms ease-out;
      }
      @keyframes jz-pop {
        from {
          transform: scale(0.96);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .jz-celebrate {
          animation: none;
        }
      }
    `,
  ],
})
export class FoundDialogComponent {
  private readonly outcomes = inject(OutcomesService);

  /** Émis après enregistrement réussi (le parent peut rafraîchir / fermer). */
  readonly done = output<void>();
  readonly closed = output<void>();

  readonly buzz = 'buzz !';
  readonly contracts = CONTRACT_TYPES;
  readonly contractLabels = CONTRACT_LABELS;
  readonly helpfulnessValues = HELPFULNESS_VALUES;
  readonly helpfulnessLabels = HELPFULNESS_LABELS;

  readonly step = signal<'form' | 'celebrate'>('form');
  readonly contract = signal<ContractType | null>(null);
  company = '';
  readonly helpfulness = signal<Helpfulness | null>(null);
  comment = '';
  readonly saving = signal(false);
  readonly pauseState = signal<'idle' | 'busy' | 'done'>('idle');

  pauseLabel(): string {
    if (this.pauseState() === 'done') return 'Automatisations en pause ✓';
    if (this.pauseState() === 'busy') return 'Mise en pause…';
    return 'Mettre mes automatisations en pause';
  }

  async pause(): Promise<void> {
    this.pauseState.set('busy');
    try {
      await this.outcomes.pauseAutomations();
      this.pauseState.set('done');
    } catch {
      this.pauseState.set('idle');
    }
  }

  async finish(): Promise<void> {
    const contractType = this.contract();
    if (!contractType) return;
    this.saving.set(true);
    try {
      await this.outcomes.create({
        contractType,
        companyName: this.company.trim() || undefined,
        helpfulness: this.helpfulness() ?? undefined,
        comment: this.comment.trim() || undefined,
      });
      this.done.emit();
    } finally {
      this.saving.set(false);
    }
  }
}
