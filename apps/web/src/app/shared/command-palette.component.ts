import { Component, ElementRef, HostListener, computed, effect, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../core/auth/auth.service';

interface Command {
  label: string;
  hint: string;
  icon: string;
  /** Route à ouvrir, avec d'éventuels paramètres de requête. */
  path: string;
  query?: Record<string, string>;
  /** `true` → réservée à l'admin. */
  admin?: boolean;
}

/**
 * Palette de commandes (CLAUDE.md §11, clins d'œil dev) : ouverte par Ctrl+K / Cmd+K.
 * Navigue entre les écrans et déclenche les actions principales (chercher des offres,
 * nouvelle automatisation, écrire à une entreprise). Entièrement au clavier.
 */
@Component({
  selector: 'jz-command-palette',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[12vh]"
        (click)="close()"
        tabindex="-1"
      >
        <div
          class="w-full max-w-lg overflow-hidden rounded-card border border-border bg-surface shadow-lg"
          role="dialog"
          aria-modal="true"
          aria-label="Palette de commandes"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center gap-3 border-b border-border px-4">
            <lucide-icon name="search" [size]="18" class="text-text-muted" />
            <input
              #search
              type="text"
              [value]="term()"
              (input)="onInput($event)"
              (keydown)="onKeydown($event)"
              placeholder="Naviguer ou lancer une action…"
              aria-label="Rechercher une commande"
              role="combobox"
              aria-expanded="true"
              aria-controls="jz-cmd-list"
              class="w-full bg-transparent py-3.5 text-sm text-text outline-none placeholder:text-text-muted"
            />
            <kbd class="hidden rounded border border-border px-1.5 py-0.5 font-mono text-[11px] text-text-muted sm:block">Échap</kbd>
          </div>

          @if (results().length === 0) {
            <p class="px-4 py-6 text-center text-sm text-text-muted">Aucune commande</p>
          } @else {
            <ul id="jz-cmd-list" role="listbox" class="max-h-80 overflow-y-auto p-1">
              @for (cmd of results(); track cmd.path + cmd.label; let i = $index) {
                <li
                  role="option"
                  [attr.aria-selected]="active() === i"
                  [id]="'jz-cmd-' + i"
                  (click)="run(cmd)"
                  (mouseenter)="active.set(i)"
                  class="flex cursor-pointer items-center gap-3 rounded-field px-3 py-2.5 text-sm"
                  [class.bg-surface-raised]="active() === i"
                >
                  <lucide-icon [name]="cmd.icon" [size]="16" class="shrink-0 text-text-muted" />
                  <span class="text-text">{{ cmd.label }}</span>
                  <span class="ml-auto text-xs text-text-muted">{{ cmd.hint }}</span>
                </li>
              }
            </ul>
          }
        </div>
      </div>
    }
  `,
})
export class CommandPaletteComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly open = signal(false);
  readonly term = signal('');
  readonly active = signal(0);

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('search');

  private readonly commands: Command[] = [
    { label: 'Accueil', hint: 'Aller à', icon: 'home', path: '/app' },
    { label: 'Relances', hint: 'Aller à', icon: 'bell', path: '/app/relances' },
    { label: 'Offres', hint: 'Aller à', icon: 'search', path: '/app/offres' },
    { label: 'Mes automatisations', hint: 'Aller à', icon: 'zap', path: '/app/offres/automatisations' },
    { label: 'Profil', hint: 'Aller à', icon: 'user', path: '/app/profil' },
    { label: 'Mon CV', hint: 'Aller à', icon: 'file-text', path: '/app/profil/cv' },
    { label: 'Paramètres', hint: 'Aller à', icon: 'settings', path: '/app/profil/parametres' },
    { label: 'Aide', hint: 'Aller à', icon: 'help-circle', path: '/app/aide' },
    { label: 'Chercher des offres', hint: 'Action', icon: 'search', path: '/app/offres' },
    { label: 'Nouvelle automatisation', hint: 'Action', icon: 'zap', path: '/app/offres/automatisations/nouvelle' },
    { label: 'Écrire à une entreprise', hint: 'Action', icon: 'pen-line', path: '/app/relances', query: { ecrire: '1' } },
    { label: 'Espace admin', hint: 'Aller à', icon: 'shield', path: '/admin', admin: true },
  ];

  /** Normalise (minuscules, sans accents) pour une recherche tolérante. */
  private norm(s: string): string {
    return s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  }

  readonly results = computed(() => {
    const isAdmin = this.auth.isAdmin();
    const q = this.norm(this.term().trim());
    return this.commands.filter((c) => {
      if (c.admin && !isAdmin) return false;
      return q === '' || this.norm(c.label).includes(q) || this.norm(c.hint).includes(q);
    });
  });

  constructor() {
    // À l'ouverture : focus sur le champ et remise à zéro de la sélection.
    effect(() => {
      if (this.open()) {
        this.active.set(0);
        queueMicrotask(() => this.searchInput()?.nativeElement.focus());
      }
    });
    // La sélection ne doit jamais dépasser la liste filtrée.
    effect(() => {
      if (this.active() >= this.results().length) this.active.set(0);
    });
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.open.set(!this.open());
    }
  }

  onInput(event: Event): void {
    this.term.set((event.target as HTMLInputElement).value);
    this.active.set(0);
  }

  onKeydown(event: KeyboardEvent): void {
    const list = this.results();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.active.set((this.active() + 1) % list.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.active.set((this.active() - 1 + list.length) % list.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const cmd = list[this.active()];
      if (cmd) this.run(cmd);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  close(): void {
    this.open.set(false);
    this.term.set('');
  }

  run(cmd: Command): void {
    this.close();
    void this.router.navigate([cmd.path], cmd.query ? { queryParams: cmd.query } : {});
  }
}
