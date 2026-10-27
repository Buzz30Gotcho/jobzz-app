import { Component, inject, signal } from '@angular/core';
import type { AdminUserRow, Plan } from '@jobzz/shared';
import { AdminApiService } from '../../core/admin/admin.service';

const PAGE_SIZE = 25;

/** Utilisateurs (CLAUDE.md §4.11) : lecture seule + changer le plan / désactiver (tests). */
@Component({
  selector: 'jz-admin-users',
  standalone: true,
  template: `
    <h1 class="text-2xl font-semibold">Utilisateurs</h1>

    <input
      type="search"
      class="jz-input mt-4 max-w-sm"
      placeholder="Rechercher par email…"
      [value]="search()"
      (input)="onSearch($any($event.target).value)"
    />

    <div class="jz-card mt-4 !p-0 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="border-b border-border text-left text-text-secondary">
          <tr>
            <th class="px-4 py-3 font-medium">Email</th>
            <th class="px-4 py-3 font-medium">Inscrit le</th>
            <th class="px-4 py-3 font-medium">Plan</th>
            <th class="px-4 py-3 text-right font-medium">Cand.</th>
            <th class="px-4 py-3 text-right font-medium">Autom.</th>
            <th class="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (u of users(); track u.id; let even = $even) {
            <tr class="border-b border-border/60" [class.bg-surface-raised]="even">
              <td class="px-4 py-3">
                {{ u.email }}
                @if (u.disabled) {
                  <span class="ml-2 font-mono text-xs text-danger">désactivé</span>
                }
              </td>
              <td class="px-4 py-3 font-mono text-xs text-text-secondary">{{ date(u.createdAt) }}</td>
              <td class="px-4 py-3 font-mono">{{ u.plan }}</td>
              <td class="px-4 py-3 text-right font-mono">{{ u.applicationCount }}</td>
              <td class="px-4 py-3 text-right font-mono">{{ u.automationCount }}</td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                  <button
                    type="button"
                    class="rounded-field border border-border px-2 py-1 text-xs transition-colors hover:bg-surface"
                    [disabled]="busy() === u.id"
                    (click)="togglePlan(u)"
                  >
                    {{ u.plan === 'premium' ? '→ gratuit' : '→ premium' }}
                  </button>
                  <button
                    type="button"
                    class="rounded-field border border-border px-2 py-1 text-xs transition-colors hover:bg-surface"
                    [class.text-danger]="!u.disabled"
                    [disabled]="busy() === u.id"
                    (click)="toggleDisabled(u)"
                  >
                    {{ u.disabled ? 'Réactiver' : 'Désactiver' }}
                  </button>
                </div>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="6" class="px-4 py-6 text-center text-text-secondary">Aucun utilisateur.</td></tr>
          }
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex items-center justify-between text-sm text-text-secondary">
      <span class="font-mono">{{ total() }} utilisateur(s)</span>
      <div class="flex gap-2">
        <button type="button" class="jz-btn-ghost text-sm" [disabled]="skip() === 0" (click)="prev()">Précédent</button>
        <button type="button" class="jz-btn-ghost text-sm" [disabled]="skip() + pageSize >= total()" (click)="next()">Suivant</button>
      </div>
    </div>
  `,
})
export class AdminUsersComponent {
  private readonly api = inject(AdminApiService);

  readonly pageSize = PAGE_SIZE;
  readonly users = signal<AdminUserRow[]>([]);
  readonly total = signal(0);
  readonly search = signal('');
  readonly skip = signal(0);
  readonly busy = signal<string | null>(null);

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    void this.load();
  }

  date(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.skip.set(0);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => void this.load(), 300);
  }

  prev(): void {
    this.skip.set(Math.max(0, this.skip() - this.pageSize));
    void this.load();
  }

  next(): void {
    this.skip.set(this.skip() + this.pageSize);
    void this.load();
  }

  async togglePlan(u: AdminUserRow): Promise<void> {
    const plan: Plan = u.plan === 'premium' ? 'free' : 'premium';
    this.busy.set(u.id);
    try {
      await this.api.setPlan(u.id, plan);
      await this.load();
    } finally {
      this.busy.set(null);
    }
  }

  async toggleDisabled(u: AdminUserRow): Promise<void> {
    this.busy.set(u.id);
    try {
      await this.api.setDisabled(u.id, !u.disabled);
      await this.load();
    } finally {
      this.busy.set(null);
    }
  }

  private async load(): Promise<void> {
    const res = await this.api.users(this.search(), this.skip(), this.pageSize);
    this.users.set(res.users);
    this.total.set(res.total);
  }
}
