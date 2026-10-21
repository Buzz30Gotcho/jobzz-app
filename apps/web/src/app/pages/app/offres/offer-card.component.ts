import { Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import type { PublicOffer } from '@jobzz/shared';

/** Carte d'offre (CLAUDE.md §4.5). Les offres floutées (gratuit) ne montrent que rang + score. */
@Component({
  selector: 'jz-offer-card',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    @if (offer().locked) {
      <div class="jz-card flex items-center gap-4 opacity-60">
        <span class="font-mono text-sm text-text-muted">#{{ rank() }}</span>
        <div class="h-4 flex-1 rounded bg-surface-raised blur-[2px]">&nbsp;</div>
        <span class="jz-score font-mono text-sm text-text-muted">{{ offer().score }}%</span>
      </div>
    } @else {
      <div class="jz-card">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <button type="button" class="text-left" (click)="open.emit()">
              <h3 class="truncate font-semibold hover:text-accent">{{ offer().title }}</h3>
            </button>
            <p class="truncate text-sm text-text-secondary">
              {{ offer().companyName ?? 'Entreprise non précisée' }}
              @if (offer().isDemo) {
                <span class="ml-1 rounded-full bg-surface-raised px-1.5 text-xs text-warning">Fictive</span>
              }
            </p>
            <p class="mt-1 flex flex-wrap gap-x-3 text-xs text-text-muted">
              @if (offer().locationLabel) {
                <span>{{ offer().locationLabel }}@if (offer().distanceKm !== null) { · {{ offer().distanceKm }} km }</span>
              }
              @if (offer().contractType) { <span>{{ offer().contractType }}</span> }
              @if (offer().remote && offer().remote !== 'sur_site') {
                <span>{{ offer().remote }}</span>
              }
              @if (offer().publishedAt) { <span>{{ date(offer().publishedAt) }}</span> }
              <span>via {{ offer().source }}</span>
            </p>
          </div>
          <div class="shrink-0 text-right">
            <div class="font-mono text-lg text-accent">{{ offer().score }}%</div>
            <div class="text-xs text-text-secondary">{{ offer().scoreLabel }}</div>
          </div>
        </div>

        @if (offer().explanation) {
          <p class="mt-2 text-sm text-text-secondary">{{ offer().explanation }}</p>
        }

        <div class="mt-4 flex flex-wrap gap-2">
          <a class="jz-btn-primary px-3 py-1.5 text-sm" [href]="offer().url" target="_blank" rel="noopener">
            <lucide-icon name="external-link" [size]="14" /> Voir l'offre
          </a>
          <button type="button" class="jz-btn-ghost px-3 py-1.5 text-sm" (click)="apply.emit()">
            J'ai postulé
          </button>
          <button type="button" class="ml-auto text-xs text-text-muted hover:text-text" (click)="hide.emit()">
            Masquer
          </button>
        </div>
      </div>
    }
  `,
})
export class OfferCardComponent {
  readonly offer = input.required<PublicOffer>();
  readonly rank = input(0);
  readonly open = output<void>();
  readonly apply = output<void>();
  readonly hide = output<void>();

  date(iso: string | null): string {
    return iso ? new Date(iso).toLocaleDateString('fr-FR') : '';
  }
}
