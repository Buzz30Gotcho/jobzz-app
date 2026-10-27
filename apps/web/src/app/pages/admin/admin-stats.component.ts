import { Component, computed, inject, signal } from '@angular/core';
import type { AdminMetric, AdminStats } from '@jobzz/shared';
import { AdminApiService } from '../../core/admin/admin.service';

const EXPERIENCE_LABELS: Record<string, string> = {
  debutant: 'Débutant',
  moins_1_an: 'Moins d’1 an',
  '1_a_3_ans': '1 à 3 ans',
  plus_3_ans: 'Plus de 3 ans',
};

/** Statistiques admin (CLAUDE.md §4.11). Noir et blanc, chiffres clés en grand. */
@Component({
  selector: 'jz-admin-stats',
  standalone: true,
  template: `
    <h1 class="text-2xl font-semibold">Statistiques</h1>

    @if (stats(); as s) {
      <!-- 4 chiffres clés -->
      <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="jz-card">
          <p class="text-sm text-text-secondary">Utilisateurs inscrits</p>
          <p class="mt-1 font-mono text-[32px] leading-none">{{ s.headline.usersTotal.value }}</p>
          <p class="mt-2 font-mono text-xs" [class]="trendClass(s.headline.usersTotal)">{{ s.headline.usersTotal.trend.label }}</p>
        </div>
        <div class="jz-card">
          <p class="text-sm text-text-secondary">Actifs cette semaine</p>
          <p class="mt-1 font-mono text-[32px] leading-none">{{ s.headline.activeThisWeek.value }}</p>
          <p class="mt-2 font-mono text-xs" [class]="trendClass(s.headline.activeThisWeek)">{{ s.headline.activeThisWeek.trend.label }}</p>
        </div>
        <div class="jz-card">
          <p class="text-sm text-text-secondary">Nouveaux cette semaine</p>
          <p class="mt-1 font-mono text-[32px] leading-none">{{ s.headline.newThisWeek.value }}</p>
          <p class="mt-2 font-mono text-xs" [class]="trendClass(s.headline.newThisWeek)">{{ s.headline.newThisWeek.trend.label }}</p>
        </div>
        <div class="jz-card">
          <p class="text-sm text-text-secondary">Abonnés Premium</p>
          <p class="mt-1 font-mono text-[32px] leading-none">{{ s.headline.premium.value }}</p>
          <p class="mt-2 font-mono text-xs" [class]="trendClass(s.headline.premium)">{{ s.headline.premium.trend.label }}</p>
        </div>
      </div>

      <!-- Nouveaux inscrits par semaine (12 semaines) -->
      <section class="jz-card mt-4">
        <h2 class="font-semibold">Nouveaux inscrits par semaine (12 dernières semaines)</h2>
        <div class="mt-4 flex items-end gap-1" style="height:120px">
          @for (b of s.newUsersByWeek; track b.week) {
            <div class="flex flex-1 flex-col items-center justify-end" [title]="b.week + ' : ' + b.count">
              <div class="w-full rounded-t bg-text-secondary" [style.height.%]="barHeight(b.count)"></div>
            </div>
          }
        </div>
        <p class="mt-2 font-mono text-xs text-text-muted">Barres grises · hauteur relative au maximum de la période.</p>
      </section>

      <div class="mt-4 grid gap-4 lg:grid-cols-2">
        <!-- Abonnements -->
        <section class="jz-card">
          <h2 class="font-semibold">Abonnements</h2>
          @if (!s.hasSubscriptions) {
            <p class="mt-3 text-sm text-text-secondary">Pas encore d'abonnement.</p>
          } @else {
            <ul class="mt-3 space-y-1 font-mono text-sm">
              <li>Mensuel : {{ s.premiumBreakdown.monthly }}</li>
              <li>Pass 3 mois : {{ s.premiumBreakdown.pass_3_months }}</li>
              <li>Lancement : {{ s.premiumBreakdown.launch }}</li>
              <li class="pt-2 text-text-secondary">
                Durée moyenne : {{ s.avgSubscriptionDays === null ? '—' : s.avgSubscriptionDays + ' j' }}
              </li>
            </ul>
            <p class="mt-2 text-xs text-text-muted">Les paiements en local sont des paiements de test.</p>
          }
        </section>

        <!-- Activité & engagement -->
        <section class="jz-card">
          <h2 class="font-semibold">Activité</h2>
          <ul class="mt-3 space-y-1 font-mono text-sm">
            <li>Actifs 7 j : {{ s.activeUsers.d7 }} · 30 j : {{ s.activeUsers.d30 }}</li>
            <li>Automatisations actives : {{ s.usage.activeAutomations }}</li>
            <li>Mails d'offres envoyés : {{ s.usage.offerMailsSent }}</li>
            <li>Relances envoyées : {{ s.usage.followUpsSent }}</li>
            <li class="pt-2">Entretiens obtenus : {{ s.interviews }}</li>
          </ul>
        </section>

        <!-- J'ai trouvé ! -->
        <section class="jz-card">
          <h2 class="font-semibold">« J'ai trouvé ! »</h2>
          <p class="mt-2 font-mono text-sm">Total : {{ s.jobOutcomes.total }}</p>
          @if (s.jobOutcomes.total > 0) {
            <div class="mt-2">
              <p class="text-xs text-text-secondary">Par type de contrat</p>
              <ul class="font-mono text-sm">
                @for (c of contractEntries(); track c.key) {
                  <li>{{ c.key }} : {{ c.value }}</li>
                }
              </ul>
            </div>
            <div class="mt-2">
              <p class="text-xs text-text-secondary">Jobzz t'a aidé ?</p>
              <p class="font-mono text-sm">
                Beaucoup {{ s.jobOutcomes.helpfulness.beaucoup }} · Un peu {{ s.jobOutcomes.helpfulness.un_peu }} ·
                Pas vraiment {{ s.jobOutcomes.helpfulness.pas_vraiment }}
              </p>
            </div>
          }
        </section>

        <!-- Répartition par expérience -->
        <section class="jz-card">
          <h2 class="font-semibold">Inscrits par niveau d'expérience</h2>
          <ul class="mt-3 space-y-1 font-mono text-sm">
            @for (e of experienceEntries(); track e.key) {
              <li>{{ e.label }} : {{ e.value }}</li>
            }
          </ul>
          <p class="mt-2 text-xs text-text-muted">
            Si « Plus de 3 ans » grossit, c'est le signal d'une demande au-delà des juniors.
          </p>
        </section>
      </div>
    } @else {
      <p class="mt-6 text-text-secondary">Chargement…</p>
    }
  `,
})
export class AdminStatsComponent {
  private readonly api = inject(AdminApiService);
  readonly stats = signal<AdminStats | null>(null);

  readonly maxWeek = computed(() =>
    Math.max(1, ...(this.stats()?.newUsersByWeek.map((b) => b.count) ?? [1])),
  );

  readonly contractEntries = computed(() =>
    Object.entries(this.stats()?.jobOutcomes.byContract ?? {}).map(([key, value]) => ({ key, value })),
  );

  readonly experienceEntries = computed(() =>
    Object.entries(this.stats()?.experienceDistribution ?? {}).map(([key, value]) => ({
      key,
      label: EXPERIENCE_LABELS[key] ?? key,
      value,
    })),
  );

  constructor() {
    void this.load();
  }

  trendClass(m: AdminMetric): string {
    // Noir et blanc : pas de vert/rouge pour les tendances, on reste en nuances de gris.
    return m.trend.direction === 'flat' ? 'text-text-muted' : 'text-text-secondary';
  }

  barHeight(count: number): number {
    return Math.round((count / this.maxWeek()) * 100);
  }

  private async load(): Promise<void> {
    this.stats.set(await this.api.stats());
  }
}
