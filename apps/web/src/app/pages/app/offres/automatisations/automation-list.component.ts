import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import type { AlertSuggestion, AutomationPreview, PublicAutomation } from '@jobzz/shared';
import { AutomationsService } from '../../../../core/automations/automations.service';
import { OffresTabsComponent } from '../offres-tabs.component';

/**
 * Onglet « Mes automatisations » (CLAUDE.md §4.6). Liste des automatisations (résumé, statut, offres
 * envoyées), diagnostic « Pourquoi je n'ai rien reçu ? » (entonnoir via aperçu), et la section
 * « Et sur les autres sites » (aide aux alertes, visible par tous).
 */
@Component({
  selector: 'jz-automation-list',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, OffresTabsComponent],
  template: `
    <div class="mx-auto w-full max-w-6xl">
      <jz-offres-tabs />

      <div class="mt-6 flex items-center justify-between">
        <p class="text-sm text-text-secondary">
          {{ activeCount() }} active{{ activeCount() > 1 ? 's' : '' }}
        </p>
        <div class="flex items-center gap-2">
          @if (automations().length > 0) {
            <button type="button" class="jz-btn-ghost" [disabled]="running()" (click)="runNow()">
              <lucide-icon name="mail" [size]="16" /> {{ running() ? 'Envoi…' : 'Recevoir le mail maintenant' }}
            </button>
          }
          <a routerLink="/app/offres/automatisations/nouvelle" class="jz-btn-primary">
            <lucide-icon name="plus" [size]="16" /> Nouvelle automatisation
          </a>
        </div>
      </div>
      @if (runNote()) {
        <p class="mt-3 rounded-field border border-border bg-surface-raised px-3 py-2 text-sm text-text-secondary">{{ runNote() }}</p>
      }

      @if (loading()) {
        <div class="mt-6 h-28 animate-pulse rounded-card bg-surface-raised"></div>
      } @else {
        @if (automations().length === 0) {
          <div class="jz-card mt-6 text-center">
            <lucide-icon name="zap" [size]="28" class="mx-auto text-accent" />
            <p class="mt-3 font-medium">Et si les offres venaient à toi ?</p>
            <p class="mt-1 text-sm text-text-secondary">
              Crée une automatisation : Jobzz surveille les offres et t'envoie les meilleures par mail.
            </p>
            <a routerLink="/app/offres/automatisations/nouvelle" class="jz-btn-primary mt-4 inline-flex">
              Créer mon automatisation
            </a>
          </div>
        } @else {
          <ul class="mt-6 space-y-4">
            @for (a of automations(); track a.id) {
              <li class="jz-card">
                <div class="flex items-start justify-between gap-4">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <h3 class="truncate font-semibold">{{ a.name }}</h3>
                      <span class="rounded-full px-2 py-0.5 text-xs" [class]="statusClass(a)">{{ statusLabel(a) }}</span>
                    </div>
                    <p class="mt-1 truncate text-sm text-text-secondary">{{ a.summary }}</p>
                    <p class="mt-1 text-xs text-text-muted">
                      Ces 4 dernières semaines : {{ a.sentLast28Days }} offre{{ a.sentLast28Days > 1 ? 's' : '' }}
                      @if (a.lastRunAt) { · dernier passage {{ date(a.lastRunAt) }} }
                    </p>
                  </div>
                </div>

                <div class="mt-3 flex flex-wrap gap-2 border-t border-border pt-3 text-sm">
                  <a [routerLink]="['/app/offres/automatisations', a.id]" class="jz-btn-ghost px-3 py-1.5">Modifier</a>
                  <button type="button" class="jz-btn-ghost px-3 py-1.5" (click)="toggleStatus(a)">
                    {{ a.status === 'active' ? 'Mettre en pause' : 'Reprendre' }}
                  </button>
                  <button type="button" class="jz-btn-ghost px-3 py-1.5" (click)="duplicate(a)">Dupliquer</button>
                  <button type="button" class="jz-btn-ghost px-3 py-1.5" (click)="why(a)">Pourquoi je n'ai rien reçu ?</button>
                  <button type="button" class="ml-auto text-xs text-danger hover:underline" (click)="remove(a)">Supprimer</button>
                </div>

                @if (funnels()[a.id]; as f) {
                  <div class="mt-3 rounded-field border border-border bg-surface-raised p-3 text-sm">
                    <p class="font-medium">Entonnoir (sur les 2 dernières semaines)</p>
                    <ul class="mt-2 space-y-1 text-text-secondary">
                      <li>Offres trouvées : {{ f.funnel.trouvees }}</li>
                      <li>Après métier et lieu : {{ f.funnel.apresMetierLieu }}</li>
                      <li>Après contrat, date et filtre junior : {{ f.funnel.apresContratDateJunior }}</li>
                      <li>Au-dessus du score minimum : {{ f.funnel.auDessusDuScore }}</li>
                    </ul>
                    <p class="mt-2 text-xs text-text-muted">Prévision : environ {{ f.previsionParSemaine }} offre(s) par semaine.</p>
                  </div>
                }
              </li>
            }
          </ul>
        }

        <!-- Et sur les autres sites (aide aux alertes) -->
        <section class="mt-10">
          <h2 class="font-semibold">Et sur les autres sites</h2>
          <p class="mt-1 text-sm text-text-secondary">
            Jobzz ne peut pas récupérer les offres d'Indeed, LinkedIn… mais il t'aide à y régler des alertes précises.
          </p>
          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            @for (s of alerts(); track s.site) {
              <div class="jz-card">
                <h3 class="font-medium">{{ s.label }}</h3>
                <code class="mt-2 block break-words rounded-field bg-surface-raised p-2 text-xs">{{ s.query }}</code>
                <ul class="mt-2 text-xs text-text-muted">
                  @for (f of s.filters; track f) { <li>{{ f }}</li> }
                </ul>
                <div class="mt-3 flex gap-2">
                  <button type="button" class="jz-btn-ghost px-3 py-1.5 text-sm" (click)="copy(s)">
                    <lucide-icon name="copy" [size]="14" /> {{ copied() === s.site ? 'Copié' : 'Copier' }}
                  </button>
                  <a class="jz-btn-ghost px-3 py-1.5 text-sm" [href]="s.url" target="_blank" rel="noopener">
                    <lucide-icon name="external-link" [size]="14" /> Ouvrir
                  </a>
                </div>
                <p class="mt-2 text-xs text-text-muted">{{ s.help }}</p>
              </div>
            }
          </div>
        </section>
      }
    </div>
  `,
})
export class AutomationListComponent implements OnInit {
  private readonly service = inject(AutomationsService);
  private readonly router = inject(Router);

  readonly automations = signal<PublicAutomation[]>([]);
  readonly alerts = signal<AlertSuggestion[]>([]);
  readonly funnels = signal<Record<string, AutomationPreview>>({});
  readonly loading = signal(true);
  readonly copied = signal<string | null>(null);
  readonly running = signal(false);
  readonly runNote = signal<string | null>(null);

  async runNow(): Promise<void> {
    if (this.running()) return;
    this.running.set(true);
    this.runNote.set(null);
    try {
      const r = await this.service.runMine();
      this.runNote.set(
        r.sent
          ? `Mail envoyé (${r.candidates} offre(s)). Regarde ta boîte mail (Mailpit en local).`
          : `Aucun mail envoyé : ${r.reason ?? 'rien à envoyer'} (offres trouvées : ${r.candidates}).`,
      );
    } catch {
      this.runNote.set('Impossible de lancer les automatisations pour le moment.');
    } finally {
      this.running.set(false);
    }
  }

  activeCount(): number {
    return this.automations().filter((a) => a.status === 'active').length;
  }

  async ngOnInit(): Promise<void> {
    try {
      const [automations, alerts] = await Promise.all([this.service.list(), this.service.alertHelpers()]);
      this.automations.set(automations);
      this.alerts.set(alerts);
    } finally {
      this.loading.set(false);
    }
  }

  date(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR');
  }

  statusLabel(a: PublicAutomation): string {
    return a.status === 'active' ? 'Active' : a.status === 'en_pause' ? 'En pause' : 'Erreur';
  }

  statusClass(a: PublicAutomation): string {
    if (a.status === 'erreur') return 'bg-surface-raised text-danger';
    if (a.status === 'en_pause') return 'bg-surface-raised text-text-muted';
    return 'bg-accent-bg text-accent';
  }

  async toggleStatus(a: PublicAutomation): Promise<void> {
    const updated = await this.service.setStatus(a.id, a.status === 'active' ? 'en_pause' : 'active');
    this.replace(updated);
  }

  async duplicate(a: PublicAutomation): Promise<void> {
    const copy = await this.service.duplicate(a.id);
    // On ouvre directement la copie pour l'ajuster (c'est tout l'intérêt de dupliquer).
    await this.router.navigate(['/app/offres/automatisations', copy.id]);
  }

  async remove(a: PublicAutomation): Promise<void> {
    await this.service.remove(a.id);
    this.automations.update((list) => list.filter((x) => x.id !== a.id));
  }

  async why(a: PublicAutomation): Promise<void> {
    const preview = await this.service.preview(a.criteria);
    this.funnels.update((f) => ({ ...f, [a.id]: preview }));
  }

  async copy(s: AlertSuggestion): Promise<void> {
    try {
      await navigator.clipboard.writeText(s.query);
    } catch {
      /* presse-papiers indisponible */
    }
    this.copied.set(s.site);
    setTimeout(() => this.copied.set(null), 2000);
  }

  private replace(a: PublicAutomation): void {
    this.automations.update((list) => list.map((x) => (x.id === a.id ? a : x)));
  }
}
