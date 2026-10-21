import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

interface Health {
  status: string;
  app: string;
  planEnforcement: boolean;
  jobSourcesMode: string;
  database: boolean;
  timestamp: string;
}

/**
 * Santé du système (placeholder de socle, thème noir et blanc).
 * La vraie page (sources, files, exécutions, mails) arrive à l'étape 9.
 * La légende des couleurs est toujours visible (CLAUDE.md §11).
 */
@Component({
  selector: 'jz-admin-health',
  standalone: true,
  template: `
    <h1 class="text-2xl font-semibold">Santé du système</h1>
    <p class="mt-1 font-mono text-xs text-text-secondary">
      ● Blanc : OK · ● Jaune : à surveiller · ● Rouge : en panne
    </p>

    @if (health(); as h) {
      <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="jz-card">
          <p class="text-sm text-text-secondary">API</p>
          <p class="mt-1 font-mono text-2xl" [class.text-warning]="h.status !== 'ok'">
            {{ h.status === 'ok' ? 'OK' : 'Dégradé' }}
          </p>
        </div>
        <div class="jz-card">
          <p class="text-sm text-text-secondary">Base de données</p>
          <p class="mt-1 font-mono text-2xl" [class.text-danger]="!h.database">
            {{ h.database ? 'OK' : 'En panne' }}
          </p>
        </div>
        <div class="jz-card">
          <p class="text-sm text-text-secondary">Sources d'offres</p>
          <p class="mt-1 font-mono text-2xl uppercase">{{ h.jobSourcesMode }}</p>
        </div>
        <div class="jz-card">
          <p class="text-sm text-text-secondary">PLAN_ENFORCEMENT</p>
          <p class="mt-1 font-mono text-2xl">{{ h.planEnforcement ? 'ON' : 'OFF' }}</p>
        </div>
      </div>
    } @else {
      <p class="mt-6 text-text-secondary">Chargement…</p>
    }
  `,
})
export class AdminHealthComponent {
  private readonly http = inject(HttpClient);
  readonly health = toSignal(this.http.get<Health>('/api/health'));
}
