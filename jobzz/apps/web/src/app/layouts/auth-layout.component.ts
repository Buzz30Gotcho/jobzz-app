import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LogoComponent } from '../shared/logo.component';

@Component({
  selector: 'jz-auth-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, LogoComponent],
  template: `
    <div class="flex min-h-full items-center justify-center px-4 py-10">
      <div class="w-full max-w-md">
        <div class="mb-8 text-center">
          <a routerLink="/" aria-label="Accueil Jobzz"><jz-logo [size]="28" /></a>
        </div>
        <div class="jz-card">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
})
export class AuthLayoutComponent {}
