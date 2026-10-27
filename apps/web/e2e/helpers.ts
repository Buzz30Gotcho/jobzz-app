import { expect, type Page } from '@playwright/test';

/** Mot de passe des comptes démo (voir prisma/seed.ts). */
export const DEMO_PASSWORD = 'demo-jobzz-2026';
export const DEMO_EMAIL = 'demo@jobzz.local';

/** Identifiants admin (voir .env / .env.example). */
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@jobzz.local';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin-change-me-10';

/** Un email unique par exécution, pour ne jamais entrer en collision en base. */
export function uniqueEmail(prefix = 'e2e'): string {
  return `${prefix}+${Date.now()}${Math.floor(Math.random() * 1000)}@jobzz.test`;
}

/** Inscription d'un nouveau compte → renvoie sur l'accueil guidé. */
export async function register(page: Page, email: string, password = 'motdepasse-e2e'): Promise<void> {
  await page.goto('/inscription');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await page.waitForURL('**/app/bienvenue', { timeout: 20_000 });
}

/** Connexion d'un compte existant → attend l'arrivée dans l'application. */
export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/connexion');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForURL('**/app**', { timeout: 20_000 });
}

/** Déconnexion via le menu compte. */
export async function logout(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Mon compte' }).click();
  await page.getByRole('menuitem', { name: 'Déconnexion' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/app'), { timeout: 20_000 });
}

/** Choisit une commune dans un champ `jz-commune-field` (autocomplétion via l'API référentiels). */
export async function pickCommune(page: Page, query: string): Promise<void> {
  const input = page.getByPlaceholder('Ajoute une ville (ex. Montpellier)');
  await input.fill(query);
  // La liste de suggestions apparaît ; on clique la proposition qui porte le nom cherché.
  const option = page.getByRole('button', { name: new RegExp(query, 'i') }).first();
  await expect(option).toBeVisible({ timeout: 15_000 });
  await option.click();
}
