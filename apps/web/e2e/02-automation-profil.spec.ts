import { expect, test } from '@playwright/test';
import { DEMO_EMAIL, DEMO_PASSWORD, login } from './helpers';

/**
 * Automatisation créée à partir du profil (CLAUDE.md §13) : le formulaire « Nouvelle
 * automatisation » est pré-rempli depuis le profil du compte démo ; on l'active directement.
 */
test('nouvelle automatisation pré-remplie depuis le profil, puis activation', async ({ page }) => {
  await login(page, DEMO_EMAIL, DEMO_PASSWORD);

  await page.goto('/app/offres/automatisations/nouvelle');
  // Le nom est pré-rempli depuis le profil (ex. « Offres <métier> »).
  await expect(page.locator('#name')).not.toHaveValue('');

  await page.getByRole('button', { name: 'Activer' }).click();

  // Retour à la liste des automatisations (le bouton « Nouvelle automatisation » y figure).
  await page.waitForURL('**/app/offres/automatisations', { timeout: 20_000 });
  await expect(page.getByRole('link', { name: /Nouvelle automatisation/ })).toBeVisible();
});
