import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

/** Écran temporaire pour les sections encore à construire (titre/sous-titre via les données de route). */
@Component({
  selector: 'jz-placeholder',
  standalone: true,
  template: `
    <div class="mx-auto max-w-3xl">
      <h1 class="text-2xl font-semibold">{{ data().title }}</h1>
      <p class="mt-2 text-text-secondary">{{ data().subtitle }}</p>
      <div class="jz-card mt-6">
        <p class="text-sm text-text-muted">Cette section sera construite dans une prochaine étape.</p>
      </div>
    </div>
  `,
})
export class PlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  readonly data = toSignal(
    this.route.data.pipe(
      map((d) => ({
        title: (d['title'] as string) ?? 'Bientôt',
        subtitle: (d['subtitle'] as string) ?? '',
      })),
    ),
    { initialValue: { title: 'Bientôt', subtitle: '' } },
  );
}
