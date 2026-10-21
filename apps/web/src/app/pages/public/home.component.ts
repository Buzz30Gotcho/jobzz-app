import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

interface Block {
  icon: string;
  title: string;
  text: string;
}

/** Page d'accueil publique : ce que fait Jobzz, en 3 blocs (CLAUDE.md §3). */
@Component({
  selector: 'jz-home',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  template: `
    <section class="mx-auto max-w-6xl px-4 py-16 md:py-24">
      <div class="max-w-2xl">
        <p class="mb-4 font-mono text-sm uppercase tracking-widest text-accent">
          Les débuts de carrière
        </p>
        <h1 class="text-4xl font-bold leading-tight md:text-5xl">
          Trouve les offres qui te correspondent <span class="text-accent">vraiment</span>, et
          relance au bon moment.
        </h1>
        <p class="mt-6 text-lg text-text-secondary">
          Stage, alternance ou premier emploi, tous secteurs. Jobzz trie les offres juniors,
          t'explique pourquoi elles collent, et te rappelle de « buzzer » les entreprises.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <a routerLink="/inscription" class="jz-btn-primary">Créer mon compte</a>
          <a routerLink="/pourquoi-jobzz" class="jz-btn-ghost">Pourquoi Jobzz ?</a>
        </div>
      </div>

      <div class="mt-16 grid gap-6 md:grid-cols-3">
        @for (b of blocks; track b.title) {
          <div class="jz-card">
            <div
              class="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-field bg-accent-bg text-accent"
            >
              <lucide-icon [name]="b.icon" [size]="20" />
            </div>
            <h2 class="mb-2 text-lg font-semibold">{{ b.title }}</h2>
            <p class="text-text-secondary">{{ b.text }}</p>
          </div>
        }
      </div>
    </section>
  `,
})
export class HomeComponent {
  readonly blocks: Block[] = [
    {
      icon: 'target',
      title: 'Une recherche précise et honnête',
      text: 'Des offres juniors filtrées selon ton métier, ton contrat et ta date de début. Un score et une explication sur chaque offre. Jamais de fausses offres.',
    },
    {
      icon: 'zap',
      title: 'Les offres viennent à toi',
      text: 'Des automatisations qui tournent et t’envoient par mail les nouvelles offres pertinentes, dès qu’elles sortent.',
    },
    {
      icon: 'bell',
      title: 'Relance sans y penser',
      text: '7 jours après avoir postulé, Jobzz te rappelle de « buzzer » l’entreprise avec un message prêt à envoyer. Tu valides, tu envoies.',
    },
  ];
}
