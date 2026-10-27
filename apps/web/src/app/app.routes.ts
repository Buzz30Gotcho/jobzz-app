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
          import('./pages/app/relances/buzzer.component').then((m) => m.BuzzerComponent),
      },
      {
        path: 'relances/candidatures',
        loadComponent: () =>
          import('./pages/app/relances/candidatures.component').then((m) => m.CandidaturesComponent),
      },
      {
        path: 'offres',
        loadComponent: () =>
          import('./pages/app/offres/recherche.component').then((m) => m.RechercheComponent),
      },
      {
        path: 'offres/automatisations',
        loadComponent: () =>
          import('./pages/app/offres/automatisations/automation-list.component').then(
            (m) => m.AutomationListComponent,
          ),
      },
      {
        path: 'offres/automatisations/nouvelle',
        loadComponent: () =>
          import('./pages/app/offres/automatisations/automation-form.component').then(
            (m) => m.AutomationFormComponent,
          ),
      },
      {
        path: 'offres/automatisations/:id',
        loadComponent: () =>
          import('./pages/app/offres/automatisations/automation-form.component').then(
            (m) => m.AutomationFormComponent,
          ),
      },
      {
        path: 'bienvenue',
        loadComponent: () =>
          import('./pages/app/onboarding.component').then((m) => m.OnboardingComponent),
      },
      {
        path: 'profil',
        loadComponent: () =>
          import('./pages/app/profil/profil.component').then((m) => m.ProfilComponent),
      },
      {
        path: 'profil/cv',
        loadComponent: () => import('./pages/app/profil/cv.component').then((m) => m.CvComponent),
      },
      {
        path: 'profil/parametres',
        loadComponent: () =>
          import('./pages/app/profil/parametres.component').then((m) => m.ParametresComponent),
      },
      {
        path: 'profil/abonnement',
        loadComponent: () =>
          import('./pages/app/profil/abonnement.component').then((m) => m.AbonnementComponent),
      },
      {
        path: 'premium/bienvenue',
        loadComponent: () =>
          import('./pages/app/premium/bienvenue.component').then((m) => m.PremiumBienvenueComponent),
      },
      {
        path: 'aide',
        loadComponent: () => import('./pages/app/aide/faq.component').then((m) => m.FaqComponent),
      },
      {
        path: 'aide/demandes',
        loadComponent: () =>
          import('./pages/app/aide/demandes.component').then((m) => m.DemandesComponent),
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
      {
        path: 'statistiques',
        loadComponent: () =>
          import('./pages/admin/admin-stats.component').then((m) => m.AdminStatsComponent),
      },
      {
        path: 'utilisateurs',
        loadComponent: () =>
          import('./pages/admin/admin-users.component').then((m) => m.AdminUsersComponent),
      },
      {
        path: 'tickets',
        loadComponent: () =>
          import('./pages/admin/admin-tickets.component').then((m) => m.AdminTicketsComponent),
      },
      {
        path: 'tickets/:id',
        loadComponent: () =>
          import('./pages/admin/admin-ticket-detail.component').then(
            (m) => m.AdminTicketDetailComponent,
          ),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
