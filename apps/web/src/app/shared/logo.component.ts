import { Component, input } from '@angular/core';

/** Logo texte « Jobzz », le « zz » en vert. Vibre légèrement s'il y a des buzz (CLAUDE.md §11). */
@Component({
  selector: 'jz-logo',
  standalone: true,
  template: `
    <span class="font-display font-bold tracking-tight" [style.fontSize.px]="size()">
      Job<span class="text-accent" [class.jz-buzz]="buzzing()">zz</span>
    </span>
  `,
  styles: [
    `
      @keyframes jz-buzz {
        0%,
        100% {
          transform: rotate(0deg);
        }
        25% {
          transform: rotate(-6deg);
        }
        75% {
          transform: rotate(6deg);
        }
      }
      .jz-buzz {
        display: inline-block;
        animation: jz-buzz 0.4s ease-in-out infinite;
      }
      @media (prefers-reduced-motion: reduce) {
        .jz-buzz {
          animation: none;
        }
      }
    `,
  ],
})
export class LogoComponent {
  size = input(22);
  buzzing = input(false);
}
