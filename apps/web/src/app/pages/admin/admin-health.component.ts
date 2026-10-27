import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import type { AdminHealth } from '@jobzz/shared';
import { AdminApiService } from '../../core/admin/admin.service';

/**
 * Santé du système (CLAUDE.md §4.11, §11) : thème noir et blanc, légende des couleurs
 * toujours visible, les problèmes d'abord. États : OK (blanc), Dégradé (jaune), En panne (rouge).
 */
@Component({
  selector: 'jz-admin-health',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="flex items-center justify-between gap-4">
      <h1 class="text-2xl font-semibold">Santé du système</h1>
      <button type="button" class="jz-btn-ghost text-sm" [disabled]="running()" (click)="run()">
        {{ running() ? 'Lancement…' : 'Lancer les automatisations maintenant' }}
      </button>
    </div>
    <p class="mt-1 font-mono text-xs text-text-secondary">
      ● Blanc : OK · ● Jaune : à surveiller · ● Rouge : en panne
    </p>

    @if (health(); as h) {
      @if (runMessage()) {
        <p class="mt-3 text-sm text-text-secondary">{{ runMessage() }}</p>
      }

      <!-- Résumé : les problèmes d'abord, sinon « Tout fonctionne ». -->
      <div class="mt-5 jz-card">
        @if (problems().length > 0) {
          <ul class="space-y-1">
            @for (p of problems(); track p) {
              <li class="font-mono text-sm" [class.text-warning]="!p.critical" [class.text-danger]="p.critical">
                ● {{ p.label }}
              </li>
            }
          </ul>
        } @else {
          <p class="font-mono text-sm">● Tout fonctionne</p>
        }
      </div>

      <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="jz-card">
          <p class="text-sm text-text-secondary">API</p>
          <p class="mt-1 font-mono text-2xl">OK</p>
        </div>
        <div class="jz-card">
          <p class="text-sm text-text-secondary">Base de données</p>
          <p class="mt-1 font-mono text-2xl" [class.text-danger]="h.database !== 'ok'">
            {{ h.database === 'ok' ? 'OK' : 'En panne' }}
          </p>
        </div>
        <div class="jz-card">
          <p class="text-sm text-text-secondary">Sources d'offres</p>
          <p class="mt-1 font-mono text-2xl uppercase">{{ h.jobSourcesMode }}</p>
        </div>
        <div class="jz-card">
          <p class="text-sm text-text-secondary">File pg-boss</p>
          <p class="mt-1 font-mono text-2xl">{{ h.queuePending === null ? 'n/d' : h.queuePending }}</p>
        </div>

        <div class="jz-card">
          <p class="text-sm text-text-secondary">IA</p>
          @if (!h.ai.enabled) {
            <p class="mt-1 font-mono text-2xl text-text-muted">Off</p>
          } @else {
            <p class="mt-1 font-mono text-2xl" [class.text-warning]="aiDegraded()">
              {{ h.ai.successRate === null ? '—' : (h.ai.successRate * 100 | number: '1.0-0') + ' %' }}
            </p>
            <p class="mt-1 font-mono text-xs text-text-muted">
              {{ h.ai.calls24h }} appels / 24 h · {{ h.ai.avgMs === null ? '—' : h.ai.avgMs + ' ms' }}
            </p>
          }
        </div>
        <div class="jz-card">
          <p class="text-sm text-text-secondary">Automatisations / 24 h</p>
          <p class="mt-1 font-mono text-sm">
            {{ h.automations24h.success }} ok ·
            <span [class.text-warning]="h.automations24h.partial > 0">{{ h.automations24h.partial }} partiel</span> ·
            <span [class.text-danger]="h.automations24h.failed > 0">{{ h.automations24h.failed }} échec</span>
          </p>
        </div>
        <div class="jz-card">
          <p class="text-sm text-text-secondary">Mails d'offres aujourd'hui</p>
          <p class="mt-1 font-mono text-2xl">{{ h.offerMailsToday }}</p>
        </div>
        <div class="jz-card">
          <p class="text-sm text-text-secondary">Utilisateurs · autom. actives</p>
          <p class="mt-1 font-mono text-2xl">{{ h.usersTotal }} · {{ h.activeAutomations }}</p>
        </div>
      </div>
    } @else {
      <p class="mt-6 text-text-secondary">Chargement…</p>
    }
  `,
})
export class AdminHealthComponent {
  private readonly api = inject(AdminApiService);

  readonly health = signal<AdminHealth | null>(null);
  readonly running = signal(false);
  readonly runMessage = signal<string | null>(null);

  readonly aiDegraded = computed(() => {
    const h = this.health();
    return !!h && h.ai.enabled && h.ai.successRate !== null && h.ai.successRate < 0.8;
  });

  readonly problems = computed<{ label: string; critical: boolean }[]>(() => {
    const h = this.health();
    if (!h) return [];
    const out: { label: string; critical: boolean }[] = [];
    if (h.database !== 'ok') out.push({ label: 'Base de données en panne', critical: true });
    if (h.automations24h.failed > 0)
      out.push({ label: `${h.automations24h.failed} exécution(s) d'automatisation en échec (24 h)`, critical: true });
    if (h.automations24h.partial > 0)
      out.push({ label: `${h.automations24h.partial} exécution(s) partielle(s) (24 h)`, critical: false });
    if (this.aiDegraded()) out.push({ label: 'IA dégradée (taux de succès sous 80 %)', critical: false });
    return out;
  });

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.health.set(await this.api.health());
  }

  async run(): Promise<void> {
    this.running.set(true);
    this.runMessage.set(null);
    try {
      await this.api.runAutomations();
      this.runMessage.set('Exécution lancée. Les résultats apparaîtront dans quelques instants.');
      setTimeout(() => void this.load(), 3000);
    } finally {
      this.running.set(false);
    }
  }
}
