import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

/**
 * Champ d'étiquettes (pastilles) : compétences, secteurs… On tape puis Entrée pour ajouter,
 * et on clique une suggestion en un clic (CLAUDE.md §4.2). Valeur = `string[]` (two-way).
 */
@Component({
  selector: 'jz-tags-field',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  template: `
    <div class="flex flex-wrap gap-2">
      @for (tag of value(); track tag) {
        <span
          class="inline-flex items-center gap-1 rounded-full bg-accent-bg px-3 py-1 text-sm text-text"
        >
          {{ tag }}
          <button
            type="button"
            class="text-text-secondary hover:text-text"
            [attr.aria-label]="'Retirer ' + tag"
            (click)="remove(tag)"
          >
            <lucide-icon name="x" [size]="14" />
          </button>
        </span>
      }
    </div>

    <input
      class="jz-input mt-2"
      [placeholder]="placeholder()"
      [(ngModel)]="draft"
      (keydown.enter)="$event.preventDefault(); addDraft()"
    />

    @if (suggestions().length) {
      <div class="mt-2 flex flex-wrap gap-2">
        @for (suggestion of availableSuggestions(); track suggestion) {
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-sm text-text-secondary hover:border-accent hover:text-text"
            (click)="add(suggestion)"
          >
            <lucide-icon name="plus" [size]="14" /> {{ suggestion }}
          </button>
        }
      </div>
    }
  `,
})
export class TagsFieldComponent {
  readonly value = model<string[]>([]);
  readonly suggestions = input<string[]>([]);
  readonly placeholder = input('Ajoute puis Entrée');

  draft = '';

  /** Suggestions non encore sélectionnées. */
  availableSuggestions(): string[] {
    const current = new Set(this.value().map((t) => t.toLowerCase()));
    return this.suggestions().filter((s) => !current.has(s.toLowerCase()));
  }

  addDraft(): void {
    this.add(this.draft);
    this.draft = '';
  }

  add(tag: string): void {
    const clean = tag.trim();
    if (!clean) return;
    if (this.value().some((t) => t.toLowerCase() === clean.toLowerCase())) return;
    this.value.update((tags) => [...tags, clean]);
  }

  remove(tag: string): void {
    this.value.update((tags) => tags.filter((t) => t !== tag));
  }
}
