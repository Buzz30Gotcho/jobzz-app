import { Component, output, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

/** Fenêtre modale simple (fond assombri, fermeture par Échap ou clic extérieur, titre). */
@Component({
  selector: 'jz-modal',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      (click)="closed.emit()"
      (keydown.escape)="closed.emit()"
      tabindex="-1"
    >
      <div
        class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-card border border-border bg-surface p-6 sm:rounded-card"
        role="dialog"
        aria-modal="true"
        (click)="$event.stopPropagation()"
      >
        <div class="mb-4 flex items-start justify-between gap-4">
          <h2 class="text-lg font-semibold">{{ title() }}</h2>
          <button type="button" class="text-text-secondary hover:text-text" aria-label="Fermer" (click)="closed.emit()">
            <lucide-icon name="x" [size]="20" />
          </button>
        </div>
        <ng-content />
      </div>
    </div>
  `,
})
export class ModalComponent {
  readonly title = input('');
  readonly closed = output<void>();
}
