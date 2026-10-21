import { Component, inject, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import type { Commune, ProfileLocation } from '@jobzz/shared';
import { ReferentialsService } from '../core/referentials/referentials.service';

/**
 * Saisie des villes de recherche (CLAUDE.md §4.2) : autocomplétion via geo.api.gouv.fr
 * (code INSEE, département, coordonnées) et un rayon par ville. Valeur = `ProfileLocation[]`.
 */
@Component({
  selector: 'jz-commune-field',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-2">
      @for (loc of value(); track loc.label) {
        <div class="flex items-center gap-3 rounded-field border border-border bg-surface px-3 py-2">
          <lucide-icon name="map-pin" [size]="16" class="text-accent" />
          <span class="flex-1 text-sm">{{ loc.label }}</span>
          <label class="flex items-center gap-1 text-xs text-text-secondary">
            Rayon
            <input
              type="number"
              min="0"
              max="200"
              class="w-16 rounded-field border border-border bg-surface-raised px-2 py-1 text-right font-mono text-text"
              [ngModel]="loc.radiusKm"
              (ngModelChange)="setRadius(loc, $event)"
            />
            km
          </label>
          <button type="button" class="text-text-secondary hover:text-text" [attr.aria-label]="'Retirer ' + loc.label" (click)="remove(loc)">
            <lucide-icon name="x" [size]="16" />
          </button>
        </div>
      }
    </div>

    <div class="relative mt-2">
      <input
        class="jz-input"
        placeholder="Ajoute une ville (ex. Montpellier)"
        [(ngModel)]="draft"
        (ngModelChange)="onType($event)"
        role="combobox"
        [attr.aria-expanded]="results().length > 0"
      />
      @if (results().length) {
        <ul class="absolute z-20 mt-1 w-full overflow-hidden rounded-field border border-border bg-surface-raised shadow-lg">
          @for (commune of results(); track commune.code) {
            <li>
              <button type="button" class="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-surface" (click)="pick(commune)">
                <span>{{ commune.label }}</span>
                <span class="font-mono text-xs text-text-secondary">{{ commune.postalCode ?? commune.departement }}</span>
              </button>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class CommuneFieldComponent {
  private readonly referentials = inject(ReferentialsService);

  readonly value = model<ProfileLocation[]>([]);
  readonly results = signal<Commune[]>([]);
  draft = '';

  /** Rayon par défaut d'une nouvelle ville (km) — aligné sur le schéma partagé. */
  private readonly defaultRadiusKm = 30;
  private debounce?: ReturnType<typeof setTimeout>;

  onType(query: string): void {
    clearTimeout(this.debounce);
    if (query.trim().length < 2) {
      this.results.set([]);
      return;
    }
    this.debounce = setTimeout(async () => {
      this.results.set(await this.referentials.searchCommunes(query));
    }, 250);
  }

  pick(commune: Commune): void {
    if (!this.value().some((l) => l.communeCode === commune.code)) {
      this.value.update((locs) => [
        ...locs,
        {
          communeCode: commune.code,
          label: commune.label,
          lat: commune.lat,
          lng: commune.lng,
          radiusKm: this.defaultRadiusKm,
        },
      ]);
    }
    this.draft = '';
    this.results.set([]);
  }

  setRadius(loc: ProfileLocation, radius: number): void {
    const clamped = Math.max(0, Math.min(200, Math.round(radius) || 0));
    this.value.update((locs) => locs.map((l) => (l === loc ? { ...l, radiusKm: clamped } : l)));
  }

  remove(loc: ProfileLocation): void {
    this.value.update((locs) => locs.filter((l) => l !== loc));
  }
}
