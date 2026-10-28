import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import type { DashboardSummary, PublicApplication, StartChecklist } from '@jobzz/shared';
import { AuthService } from '../../core/auth/auth.service';
import { ApplicationsService } from '../../core/applications/applications.service';
import { BuzzDialogComponent } from './relances/buzz-dialog.component';
import { FoundDialogComponent } from './found-dialog.component';

/**
 * Tableau de bord (CLAUDE.md §4.9) : ligne d'accueil, carte « Bien démarrer » (nouveaux
 * utilisateurs), buzz du jour, chiffres d'activité (seulement s'il y en a) et récap de la semaine.
 */
@Component({
  selector: 'jz-dashboard',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, BuzzDialogComponent, FoundDialogComponent],
  template: `
    <div class="mx-auto w-full max-w-6xl">
      <div class="jz-rise flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold">{{ greeting() }} <span class="jz-wave" aria-hidden="true">👋</span></h1>
          <p class="mt-2 text-text-secondary">{{ todayLine() }}</p>
        </div>
        <button
          type="button"
          class="shrink-0 rounded-field border border-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-accent hover:text-text"
          (click)="showFound.set(true)"
        >
          J'ai trouvé !
        </button>
      </div>

      @if (!auth.user()?.emailVerified) {
        <div class="jz-card jz-rise mt-6 border-warning/40" style="animation-delay:40ms">
          <p class="text-sm text-text-secondary">
            Pense à confirmer ton adresse email (lien envoyé à l'inscription) pour recevoir le mail des offres.
          </p>
        </div>
      }

      <!-- Carte « Bien démarrer » (nouveaux utilisateurs, CLAUDE.md §4.9) -->
      @if (checklist(); as cl) {
        @if (!checklistHidden()) {
          <section class="jz-card jz-rise mt-6" style="animation-delay:60ms">
            @if (cl.allDone) {
              <!-- Tout est coché : petit « buzz » puis la carte disparaît. -->
              <div class="jz-buzz text-center">
                <p class="text-lg font-semibold">Tu es prêt, à toi de jouer <span class="jz-zz text-accent">bzz</span></p>
                <p class="mt-1 text-sm text-text-secondary">Tu as fait le tour de l'essentiel. Bonne chasse !</p>
                <button type="button" class="jz-btn-primary mt-4" (click)="hideChecklist()">C'est parti</button>
              </div>
            } @else {
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h2 class="font-semibold">Bien démarrer</h2>
                  <p class="mt-1 text-sm text-text-secondary">Quelques pas pour tirer le meilleur de Jobzz.</p>
                </div>
                <button type="button" class="text-xs text-text-muted hover:text-text" (click)="hideChecklist()">Masquer</button>
              </div>

              <!-- Barre de progression verte -->
              <div class="mt-4 flex items-center gap-3">
                <div class="h-2 flex-1 overflow-hidden rounded-full bg-surface-raised">
                  <div class="h-full rounded-full bg-accent transition-all" [style.width.%]="(cl.completed / cl.total) * 100"></div>
                </div>
                <span class="font-mono text-xs text-text-muted">{{ cl.completed }}/{{ cl.total }}</span>
              </div>

              <ul class="mt-4 space-y-1">
                @for (step of steps(cl); track step.key) {
                  <li>
                    @if (step.done) {
                      <div class="flex items-center gap-3 rounded-field px-2 py-2 text-sm text-text-muted">
                        <lucide-icon name="check-circle-2" [size]="18" class="shrink-0 text-accent" />
                        <span class="line-through">{{ step.label }}</span>
                      </div>
                    } @else {
                      <a
                        [routerLink]="step.route"
                        class="flex items-center gap-3 rounded-field px-2 py-2 text-sm transition-colors hover:bg-surface-raised"
                      >
                        <lucide-icon name="circle" [size]="18" class="shrink-0 text-text-muted" />
                        <span class="text-text">{{ step.label }}</span>
                        <lucide-icon name="arrow-right" [size]="14" class="ml-auto text-text-muted" />
                      </a>
                    }
                  </li>
                }
              </ul>
            }
          </section>
        }
      }

      <!-- Tes buzz du jour -->
      @if ((summary()?.dueFollowUps?.length ?? 0) > 0) {
        <section class="jz-rise mt-8" style="animation-delay:80ms">
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
        <section class="jz-rise mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4" style="animation-delay:100ms">
          @for (stat of stats(); track stat.label) {
            <div class="jz-card">
              <p class="font-mono text-2xl text-accent">{{ stat.value }}</p>
              <p class="mt-1 text-sm text-text-secondary">{{ stat.label }}</p>
            </div>
          }
        </section>

        <p class="mt-4 text-sm text-text-secondary">{{ weekRecap() }}</p>
      }

      <!-- Astuce du jour (seulement quand l'accueil serait vide) -->
      @if (showTip()) {
        <section class="jz-card jz-rise mt-8" style="animation-delay:110ms">
          <div class="flex items-start gap-3">
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-field bg-accent-bg">
              <lucide-icon name="lightbulb" [size]="18" class="text-accent" />
            </span>
            <div class="min-w-0">
              <h2 class="font-semibold">Astuce du jour</h2>
              <p class="mt-1 text-sm text-text-secondary">{{ tip().text }}</p>
              @if (tip().route) {
                <a [routerLink]="tip().route" class="group mt-3 inline-flex items-center gap-1 text-sm text-accent hover:underline">
                  {{ tip().cta }}
                  <lucide-icon name="arrow-right" [size]="14" class="transition-transform group-hover:translate-x-1" />
                </a>
              }
            </div>
          </div>
        </section>
      }

      <!-- Accès rapides -->
      <section class="jz-rise mt-8 grid gap-4 sm:grid-cols-3" style="animation-delay:130ms">
        @for (q of quickLinks; track q.route) {
          <a [routerLink]="q.route" class="jz-card jz-quick group hover:border-accent">
            <div class="flex items-start gap-3">
              <span class="grid h-9 w-9 shrink-0 place-items-center rounded-field bg-accent-bg transition-colors">
                <lucide-icon [name]="q.icon" [size]="18" class="text-accent" />
              </span>
              <div class="min-w-0">
                <h2 class="flex items-center gap-1 font-semibold">
                  {{ q.title }}
                  <lucide-icon name="arrow-right" [size]="14" class="text-text-muted transition-transform group-hover:translate-x-1" />
                </h2>
                <p class="mt-1 text-sm text-text-secondary">{{ q.desc }}</p>
              </div>
            </div>
          </a>
        }
      </section>
    </div>

    @if (buzzing(); as app) {
      <jz-buzz-dialog [application]="app" (done)="onBuzzed()" (closed)="buzzing.set(null)" />
    }
    @if (showFound()) {
      <jz-found-dialog (done)="onFound()" (closed)="showFound.set(false)" />
    }
  `,
  styles: [
    `
      .jz-buzz {
        animation: jz-pop 250ms ease-out;
      }
      .jz-zz {
        display: inline-block;
        animation: jz-vibrate 420ms ease-in-out;
      }
      /* Apparition en cascade des sections au chargement. */
      .jz-rise {
        animation: jz-rise 300ms ease-out both;
      }
      @keyframes jz-rise {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
      /* Le 👋 salue une fois à l'ouverture. */
      .jz-wave {
        display: inline-block;
        transform-origin: 70% 70%;
        animation: jz-wave 1.6s ease-in-out 0.3s 2;
      }
      @keyframes jz-wave {
        0%, 55%, 100% { transform: rotate(0); }
        10%, 30% { transform: rotate(14deg); }
        20% { transform: rotate(-8deg); }
        40% { transform: rotate(-4deg); }
        50% { transform: rotate(10deg); }
      }
      /* Léger « lift » au survol des accès rapides. */
      .jz-quick {
        transition: transform 150ms ease, border-color 150ms ease;
      }
      .jz-quick:hover {
        transform: translateY(-2px);
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
      @keyframes jz-vibrate {
        0%, 100% { transform: rotate(0); }
        20% { transform: rotate(-12deg); }
        40% { transform: rotate(10deg); }
        60% { transform: rotate(-8deg); }
        80% { transform: rotate(6deg); }
      }
      @media (prefers-reduced-motion: reduce) {
        .jz-buzz,
        .jz-zz,
        .jz-rise,
        .jz-wave {
          animation: none;
        }
        .jz-quick:hover {
          transform: none;
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly applications = inject(ApplicationsService);

  readonly summary = signal<DashboardSummary | null>(null);
  readonly buzzing = signal<PublicApplication | null>(null);
  readonly showFound = signal(false);

  /** Carte « Bien démarrer » : états depuis le serveur, masquage local immédiat. */
  readonly checklist = computed(() => this.summary()?.startChecklist ?? null);
  readonly checklistHidden = signal(false);
  private checklistPersisted = false;

  /** Accès rapides de l'accueil. */
  readonly quickLinks: { route: string; icon: string; title: string; desc: string }[] = [
    { route: '/app/offres', icon: 'search', title: 'Chercher des offres', desc: 'Les offres qui te correspondent, triées et expliquées.' },
    { route: '/app/relances', icon: 'bell', title: 'Mes relances', desc: 'Buzze les entreprises à relancer.' },
    { route: '/app/profil', icon: 'user', title: 'Mon profil', desc: 'Complète-le pour de meilleures offres.' },
  ];

  /** Astuces encourageantes, affichées quand l'accueil n'a rien d'autre à montrer. */
  private readonly tips: { text: string; route?: string; cta?: string }[] = [
    { text: 'Ajoute 3 compétences à ton profil : les offres qui te correspondent deviennent plus justes.', route: '/app/profil', cta: 'Compléter mon profil' },
    { text: 'Clique « J\'ai postulé » sur une offre : Jobzz te rappelle de relancer 7 jours plus tard.', route: '/app/offres', cta: 'Voir les offres' },
    { text: 'Dépose ton CV pour le comparer à une offre en un clic et repérer ce qui manque.', route: '/app/profil/cv', cta: 'Déposer mon CV' },
    { text: 'Active une automatisation : les nouvelles offres viennent à toi par mail.', route: '/app/offres/automatisations/nouvelle', cta: 'Créer une automatisation' },
    { text: 'Règle tes alertes sur Indeed et LinkedIn depuis l\'onglet « Mes automatisations ».', route: '/app/offres/automatisations', cta: 'Voir l\'aide aux alertes' },
  ];

  /** Astuce du jour : change chaque jour, stable dans la journée. */
  tip(): { text: string; route?: string; cta?: string } {
    return this.tips[new Date().getDate() % this.tips.length];
  }

  /** On montre l'astuce seulement quand rien d'autre ne remplit déjà l'accueil. */
  readonly showTip = computed(() => {
    if (this.hasActivity()) return false;
    if ((this.summary()?.dueFollowUps?.length ?? 0) > 0) return false;
    const cl = this.checklist();
    const checklistVisible = !!cl && !cl.allDone && !this.checklistHidden();
    return !checklistVisible;
  });

  constructor() {
    // Quand tout est coché, on masque la carte côté serveur une fois (elle ne revient plus).
    effect(() => {
      if (this.checklist()?.allDone && !this.checklistPersisted) {
        this.checklistPersisted = true;
        void this.applications.dismissChecklist().catch(() => undefined);
      }
    });
  }

  /** Les 5 étapes de la carte, avec leur libellé et l'action associée. */
  steps(cl: StartChecklist): { key: string; label: string; route: string; done: boolean }[] {
    return [
      { key: 'profile', label: 'Complète ton profil', route: '/app/profil', done: cl.done.profile },
      { key: 'search', label: 'Lance ta première recherche d\'offres', route: '/app/offres', done: cl.done.search },
      { key: 'automation', label: 'Active une automatisation', route: '/app/offres/automatisations/nouvelle', done: cl.done.automation },
      { key: 'application', label: 'Note ta première candidature', route: '/app/offres', done: cl.done.application },
      { key: 'cv', label: 'Dépose ton CV', route: '/app/profil/cv', done: cl.done.cv },
    ];
  }

  async hideChecklist(): Promise<void> {
    this.checklistHidden.set(true);
    await this.applications.dismissChecklist().catch(() => undefined);
  }

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

  onFound(): void {
    this.showFound.set(false);
  }
}
