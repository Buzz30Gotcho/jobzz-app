import {
  ApplicationConfig,
  importProvidersFrom,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  LucideAngularModule,
  Home,
  Search,
  Bell,
  User,
  HelpCircle,
  Shield,
  Zap,
  Mail,
  Lock,
  LogOut,
  Sparkles,
  Target,
  X,
  Plus,
  Check,
  Circle,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Copy,
  PenLine,
  ExternalLink,
  RefreshCw,
  Sun,
  Moon,
  ChevronDown,
  ChevronRight,
} from 'lucide-angular';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { AuthService } from './core/auth/auth.service';
import { ThemeService } from './core/theme/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(
      LucideAngularModule.pick({
        Home,
        Search,
        Bell,
        User,
        HelpCircle,
        Shield,
        Zap,
        Mail,
        Lock,
        LogOut,
        Sparkles,
        Target,
        X,
        Plus,
        Check,
        Circle,
        MapPin,
        ArrowRight,
        ArrowLeft,
        Copy,
        PenLine,
        ExternalLink,
        RefreshCw,
        Sun,
        Moon,
        ChevronDown,
        ChevronRight,
      }),
    ),
    // Applique le thème (clair/sombre) avant le premier rendu.
    provideAppInitializer(() => inject(ThemeService).init()),
    // Tente de restaurer la session (cookie de rafraîchissement) au démarrage.
    provideAppInitializer(() => inject(AuthService).restore()),
  ],
};
