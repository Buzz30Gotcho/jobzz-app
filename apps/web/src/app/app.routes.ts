import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/auth/auth.guard';

/** Plan du site (CLAUDE.md §11). Routes et composants chargés à la demande. */
export const routes: Routes = [
  // ───────────────────────── Public ─────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./layouts/public-layout.component').then((m) => m.PublicLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/public/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'tarifs',
        loadComponent: () =>
          import('./pages/public/tarifs.component').then((m) => m.TarifsComponent),
      },
      {
        path: 'pourquoi-jobzz',
        loadComponent: () =>
          import('./pages/public/pourquoi.component').then((m) => m.PourquoiComponent),
      },
      {
        path: 'desinscription',
        loadComponent: () =>
          import('./pages/public/desinscription.component').then((m) => m.DesinscriptionComponent),
      },
    ],
  },

  // ───────────────────────── Authentification ─────────────────────────
  {
    path: '',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./layouts/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      {
        path: 'connexion',
        loadComponent: () => import('./pages/auth/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'inscription',
        loadComponent: () =>
          import('./pages/auth/register.component').then((m) => m.RegisterComponent),
      },
      {
        path: 'mot-de-passe-oublie',
        loadComponent: () =>
          import('./pages/auth/forgot-password.component').then((m) => m.ForgotPasswordComponent),
      },
      {
        path: 'reinitialiser-mot-de-passe',
        loadComponent: () =>
          import('./pages/auth/reset-password.component').then((m) => m.ResetPasswordComponent),
      },
    ],
  },
  {
    // Vérification d'email : accessible connecté ou non.
    path: 'verifier-email',
    loadComponent: () =>
      import('./layouts/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/auth/verify-email.component').then((m) => m.VerifyEmailComponent),
      },
    ],
  },

  // ───────────────────────── Application ─────────────────────────
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/app/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'relances',
        loadComponent: () =>
          import('./pages/app/placeholder.component').then((m) => m.PlaceholderComponent),
        data: { title: 'Relances', subtitle: 'Tes buzz et tes candidatures (étape 3).' },
      },
      {
        path: 'offres',
        loadComponent: () =>
          import('./pages/app/placeholder.component').then((m) => m.PlaceholderComponent),
        data: { title: 'Offres', subtitle: 'Recherche et automatisations (étapes 5–6).' },
      },
      {
        path: 'profil',
        loadComponent: () =>
          import('./pages/app/placeholder.component').then((m) => m.PlaceholderComponent),
        data: { title: 'Profil', subtitle: 'Tes infos, ton CV, tes paramètres (étape 2).' },
      },
      {
        path: 'aide',
        loadComponent: () =>
          import('./pages/app/placeholder.component').then((m) => m.PlaceholderComponent),
        data: { title: 'Aide', subtitle: 'Questions fréquentes et tes demandes (étape 9).' },
      },
    ],
  },

  // ───────────────────────── Admin ─────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./layouts/admin-shell.component').then((m) => m.AdminShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/admin/admin-health.component').then((m) => m.AdminHealthComponent),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
