import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import type { DashboardSummary, PublicApplication } from '@jobzz/shared';
import { AuthService } from '../../core/auth/auth.service';
import { ApplicationsService } from '../../core/applications/applications.service';
import { BuzzDialogComponent } from './relances/buzz-dialog.component';

/**
 * Tableau de bord (CLAUDE.md §4.9) : ligne d'accueil, buzz du jour, chiffres d'activité et récap
 * de la semaine. La carte « Bien démarrer » complète et les automatisations arrivent plus tard.
 */
@Component({
  selector: 'jz-dashboard',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, BuzzDialogComponent],
  template: `
    <div class="mx-auto max-w-4xl">
      <h1 class="text-2xl font-semibold">{{ greeting() }} <span aria-hidden="true">👋</span></h1>
      <p class="mt-2 text-text-secondary">{{ todayLine() }}</p>

      @if (!auth.user()?.emailVerified) {
        <div class="jz-card mt-6 border-warning/40">
          <p class="text-sm text-text-secondary">
            Pense à confirmer ton adresse email (lien envoyé à l'inscription) pour recevoir le mail des offres.
          </p>
        </div>
      }

      <!-- Tes buzz du jour -->
      @if ((summary()?.dueFollowUps?.length ?? 0) > 0) {
        <section class="mt-8">
          <div class="flex items-center justify-between">
            <h2 class="font-semibold">Tes buzz du jour</h2>
            <a routerLink="/app/relances" class="text-sm text-accent hover:underline">Tout voir</a>
          </div>
          <ul class="mt-3 space-y-2">
            @for (app of topBuzz(); track app.id) {
              <li class="jz-card flex items-center justify-between gap-4 py-4">
                <div class="min-w-0">
                  <p class="truncate font-medium">{{ app.companyName }}</p>
                  <p class="truncate text-sm text-text-secondary">{{ app.position }}</p>
                </div>
                <button type="button" class="jz-btn-primary shrink-0" (click)="buzzing.set(app)">
                  <lucide-icon name="bell" [size]="16" /> Buzzer
                </button>
              </li>
            }
          </ul>
        </section>
      }

      <!-- Chiffres d'activité (seulement s'il y a de l'activité) -->
      @if (hasActivity()) {
        <section class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          @for (stat of stats(); track stat.label) {
            <div class="jz-card">
              <p class="font-mono text-2xl text-accent">{{ stat.value }}</p>
              <p class="mt-1 text-sm text-text-secondary">{{ stat.label }}</p>
            </div>
          }
        </section>

        <p class="mt-4 text-sm text-text-secondary">{{ weekRecap() }}</p>
      }

      <!-- Accès rapides -->
      <section class="mt-8 grid gap-4 sm:grid-cols-3">
        <a routerLink="/app/offres" class="jz-card hover:border-accent">
          <h2 class="font-semibold">Chercher des offres</h2>
          <p class="mt-1 text-sm text-text-secondary">Bientôt disponible.</p>
        </a>
        <a routerLink="/app/relances" class="jz-card hover:border-accent">
          <h2 class="font-semibold">Mes relances</h2>
          <p class="mt-1 text-sm text-text-secondary">Buzze les entreprises à relancer.</p>
        </a>
        <a routerLink="/app/profil" class="jz-card hover:border-accent">
          <h2 class="font-semibold">Mon profil</h2>
          <p class="mt-1 text-sm text-text-secondary">Complète-le pour de meilleures offres.</p>
        </a>
      </section>
    </div>

    @if (buzzing(); as app) {
      <jz-buzz-dialog [application]="app" (done)="onBuzzed()" (closed)="buzzing.set(null)" />
    }
  `,
})
export class DashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly applications = inject(ApplicationsService);

  readonly summary = signal<DashboardSummary | null>(null);
  readonly buzzing = signal<PublicApplication | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const summary = await this.applications.dashboard();
      this.summary.set(summary);
      this.applications.dueCount.set(summary.dueFollowUps.length);
    } catch {
      // Tableau de bord indisponible : on garde l'accueil minimal.
    }
  }

  greeting(): string {
    const firstName = (this.summary()?.firstName ?? this.auth.user()?.firstName)?.trim();
    return firstName ? `Salut ${firstName}` : 'Salut !';
  }

  todayLine(): string {
    const due = this.summary()?.dueFollowUps.length ?? 0;
    if (due > 0) return `${due} entreprise${due > 1 ? 's' : ''} à buzzer aujourd'hui.`;
    return "Rien d'urgent aujourd'hui. Profite-en pour chercher des offres.";
  }

  topBuzz(): PublicApplication[] {
    return (this.summary()?.dueFollowUps ?? []).slice(0, 3);
  }

  readonly hasActivity = computed(() => {
    const c = this.summary()?.counts;
    return !!c && c.applications + c.followUpsSent + c.responses + c.interviews > 0;
  });

  stats(): { label: string; value: number }[] {
    const c = this.summary()?.counts;
    if (!c) return [];
    return [
      { label: 'Candidatures', value: c.applications },
      { label: 'Relances', value: c.followUpsSent },
      { label: 'Réponses', value: c.responses },
      { label: 'Entretiens', value: c.interviews },
    ];
  }

  weekRecap(): string {
    const w = this.summary()?.week;
    if (!w) return '';
    return `Cette semaine : ${w.followUpsSent} relance(s), ${w.responses} réponse(s), ${w.interviews} entretien(s). Ça bouge !`;
  }

  async onBuzzed(): Promise<void> {
    this.buzzing.set(null);
    const summary = await this.applications.dashboard();
    this.summary.set(summary);
  }
}
