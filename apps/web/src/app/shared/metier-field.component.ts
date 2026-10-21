import { Component, inject, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import type { JobTarget, RomeJob } from '@jobzz/shared';
import { ReferentialsService } from '../core/referentials/referentials.service';

/**
 * Saisie des métiers visés (CLAUDE.md §4.2) : autocomplétion sur le référentiel ROME quand il
 * est configuré, sinon **saisie libre** (le libellé sert de mots-clés, aucun code ROME inventé).
 * Valeur = `JobTarget[]`.
 */
@Component({
  selector: 'jz-metier-field',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  template: `
    <div class="flex flex-wrap gap-2">
      @for (job of value(); track job.label) {
        <span class="inline-flex items-center gap-1 rounded-full bg-accent-bg px-3 py-1 text-sm text-text">
          {{ job.label }}
          @if (job.romeCodes.length) {
            <span class="font-mono text-xs text-text-secondary">{{ job.romeCodes[0] }}</span>
          }
          <button type="button" class="text-text-secondary hover:text-text" [attr.aria-label]="'Retirer ' + job.label" (click)="remove(job)">
            <lucide-icon name="x" [size]="14" />
          </button>
        </span>
      }
    </div>

    <div class="relative mt-2">
      <input
        class="jz-input"
        placeholder="Ex. Développeur web, Vendeur, Chargé de communication…"
        [(ngModel)]="draft"
        (ngModelChange)="onType($event)"
        (keydown.enter)="$event.preventDefault(); addFree()"
        role="combobox"
        [attr.aria-expanded]="results().length > 0"
      />
      @if (results().length) {
        <ul class="absolute z-20 mt-1 w-full overflow-hidden rounded-field border border-border bg-surface-raised shadow-lg">
          @for (job of results(); track job.code) {
            <li>
              <button type="button" class="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-surface" (click)="pick(job)">
                <span>{{ job.label }}</span>
                <span class="font-mono text-xs text-text-secondary">{{ job.code }}</span>
              </button>
            </li>
          }
        </ul>
      }
    </div>
    <p class="mt-1 text-xs text-text-muted">Entrée pour ajouter un métier libre si le tien n'apparaît pas.</p>
  `,
})
export class MetierFieldComponent {
  private readonly referentials = inject(ReferentialsService);

  readonly value = model<JobTarget[]>([]);
  readonly results = signal<RomeJob[]>([]);
  draft = '';

  private debounce?: ReturnType<typeof setTimeout>;

  onType(query: string): void {
    clearTimeout(this.debounce);
    if (query.trim().length < 2) {
      this.results.set([]);
      return;
    }
    this.debounce = setTimeout(async () => {
      this.results.set(await this.referentials.searchMetiers(query));
    }, 250);
  }

  pick(job: RomeJob): void {
    this.addTarget({ label: job.label, romeCodes: [job.code] });
  }

  addFree(): void {
    this.addTarget({ label: this.draft, romeCodes: [] });
  }

  private addTarget(target: JobTarget): void {
    const label = target.label.trim();
    if (!label) return;
    if (!this.value().some((t) => t.label.toLowerCase() === label.toLowerCase())) {
      this.value.update((jobs) => [...jobs, { ...target, label }]);
    }
    this.draft = '';
    this.results.set([]);
  }

  remove(job: JobTarget): void {
    this.value.update((jobs) => jobs.filter((j) => j.label !== job.label));
  }
}
