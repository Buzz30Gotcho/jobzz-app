import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';
const STORAGE_KEY = 'jz-theme';

/**
 * Thème du côté client (CLAUDE.md §11 — arbitrage produit : clair par défaut pour le grand public,
 * sombre en option). Au premier lancement, on suit la préférence système ; le choix de l'utilisateur
 * est ensuite mémorisé. L'espace admin reste en noir et blanc via sa propre classe `theme-admin`.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>('light');

  init(): void {
    // Clair par défaut (grand public) ; on respecte seulement un choix explicite déjà mémorisé.
    this.apply(this.read() ?? 'light');
  }

  toggle(): void {
    this.apply(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private apply(theme: Theme): void {
    this.theme.set(theme);
    // Thème clair = pas de classe (:root) ; thème sombre = classe sur <html>.
    document.documentElement.classList.toggle('theme-dark', theme === 'dark');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage indisponible (navigation privée) : le thème reste pour la session.
    }
  }

  private read(): Theme | null {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v === 'light' || v === 'dark' ? v : null;
    } catch {
      return null;
    }
  }
}
