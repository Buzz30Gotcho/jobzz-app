import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Page « Pourquoi Jobzz » : texte provisoire à la première personne (CLAUDE.md §11). */
@Component({
  selector: 'jz-pourquoi',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-2xl px-4 py-16">
      <h1 class="text-3xl font-bold">Pourquoi Jobzz</h1>
      <div class="mt-6 space-y-4 text-text-secondary">
        <p>
          Je cherche une alternance. Comme beaucoup, j'envoie des candidatures, je perds le fil, et
          les sites généralistes me noient sous des offres pour profils expérimentés.
        </p>
        <p>
          Jobzz, c'est l'outil que j'aurais voulu : une recherche précise et honnête, centrée sur
          les débuts de carrière, qui m'explique pourquoi une offre me correspond, et qui me rappelle
          de relancer au bon moment.
        </p>
        <p>
          L'outil prépare, c'est toi qui valides et qui postules. Jamais de fausses offres, jamais de
          promesse qu'on ne peut pas tenir.
        </p>
        <p class="text-text-muted">— Texte provisoire, à réécrire.</p>
      </div>
      <a routerLink="/inscription" class="jz-btn-primary mt-8">Créer mon compte</a>
    </section>
  `,
})
export class PourquoiComponent {}
