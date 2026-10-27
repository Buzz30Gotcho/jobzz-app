import { expect, test } from '@playwright/test';
import { DEMO_EMAIL, DEMO_PASSWORD, login } from './helpers';

/**
 * Automatisation réglée au formulaire, sans IA (CLAUDE.md §13) : on calcule l'aperçu
 * (prévision du nombre d'offres par semaine) puis on active.
 */
test('formulaire d\'automatisation : aperçu puis activation', async ({ page }) => {
  await login(page, DEMO_EMAIL, DEMO_PASSWORD);

  await page.goto('/app/offres/automatisations/nouvelle');
  await page.locator('#name').fill('Automatisation E2E');

  // Aperçu : la prévision s'affiche (« ~ N/sem. » ou « Aucune offre… »).
  await page.getByRole('button', { name: 'Aperçu' }).click();
  await expect(page.locator('text=/\\/sem\\.|Aucune offre/')).toBeVisible({ timeout: 30_000 });

  await page.getByRole('button', { name: 'Activer' }).click();
  await page.waitForURL('**/app/offres/automatisations', { timeout: 20_000 });
  await expect(page.getByText('Automatisation E2E').first()).toBeVisible();
});
