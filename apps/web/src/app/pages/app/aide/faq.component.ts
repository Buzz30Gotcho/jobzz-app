import { Component, inject, signal } from '@angular/core';
import type { FaqEntry } from '@jobzz/shared';
import { SupportService } from '../../../core/support/support.service';
import { AideTabsComponent } from './aide-tabs.component';

/** Rendu minimal et sûr d'un Markdown léger : gras, liens, paragraphes. */
function renderMarkdown(text: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return text
    .split(/\n{2,}/)
    .map((para) => {
      const html = escape(para.trim())
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" class="text-accent underline">$1</a>')
        .replace(/\n/g, '<br />');
      return `<p>${html}</p>`;
    })
    .join('');
}

/** Aide → Questions fréquentes (CLAUDE.md §4.10). Accordéon simple. */
@Component({
  selector: 'jz-faq',
  standalone: true,
  imports: [AideTabsComponent],
  template: `
    <div class="mx-auto max-w-3xl">
      <h1 class="text-2xl font-semibold">Aide</h1>
      <jz-aide-tabs />

      @if (loading()) {
        <div class="jz-card mt-6 h-40 animate-pulse"></div>
      } @else {
        <div class="mt-6 space-y-2">
          @for (entry of faq(); track entry.question; let i = $index) {
            <div class="jz-card !p-0 overflow-hidden">
              <button
                type="button"
                class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium transition-colors hover:bg-surface-raised"
                [attr.aria-expanded]="open() === i"
                (click)="toggle(i)"
              >
                {{ entry.question }}
                <span class="shrink-0 text-text-muted">{{ open() === i ? '−' : '+' }}</span>
              </button>
              @if (open() === i) {
                <div
                  class="space-y-2 px-5 pb-5 text-sm leading-relaxed text-text-secondary [&_p]:mb-2"
                  [innerHTML]="render(entry.answer)"
                ></div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class FaqComponent {
  private readonly support = inject(SupportService);

  readonly faq = signal<FaqEntry[]>([]);
  readonly loading = signal(true);
  readonly open = signal<number | null>(0);

  constructor() {
    void this.load();
  }

  toggle(i: number): void {
    this.open.set(this.open() === i ? null : i);
  }

  render(answer: string): string {
    return renderMarkdown(answer);
  }

  private async load(): Promise<void> {
    try {
      this.faq.set(await this.support.faq());
    } finally {
      this.loading.set(false);
    }
  }
}
