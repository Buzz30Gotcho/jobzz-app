import { expect, test } from '@playwright/test';
import { pickCommune, register, uniqueEmail } from './helpers';

/**
 * Parcours principal (CLAUDE.md §13) : inscription → accueil guidé → recherche d'offres →
 * « J'ai postulé » → la candidature est créée et visible dans « Mes candidatures ».
 * (La relance n'apparaît que 7 jours après la candidature : non testable à chaud ici.)
 */
test('inscription, accueil guidé, recherche et « J\'ai postulé »', async ({ page }) => {
  await register(page, uniqueEmail());

  // Écran 1 de l'accueil guidé : métier (texte libre), contrat, ville, date de début.
  await expect(page.getByRole('heading', { name: "Qu'est-ce que tu cherches ?" })).toBeVisible();
  await page.getByPlaceholder(/Développeur web/).fill('Développeur web');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: /Retirer Développeur web/ })).toBeVisible();
  await page.getByRole('button', { name: 'Alternance', exact: true }).click();
  await pickCommune(page, 'Montpellier');
  await expect(page.getByRole('button', { name: /Retirer Montpellier/ })).toBeVisible();
  await page.locator('#date').fill('2027-01-01');

  await page.getByRole('button', { name: 'Continuer' }).click();

  // Écran 2 : compétences (indispensables pour obtenir un score ≥ 40 % sur les offres).
  await expect(page.getByRole('heading', { name: 'Tes compétences' })).toBeVisible();
  const skillInput = page.locator('input[placeholder*="compétence"]:visible');
  for (const skill of ['JavaScript', 'React']) {
    await skillInput.click();
    await skillInput.fill(skill);
    await skillInput.press('Enter');
    await expect(page.getByRole('button', { name: new RegExp(`Retirer ${skill}`) })).toBeVisible();
  }

  // Écran 3 (automatisations) puis tableau de bord.
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: 'Terminer' }).click();
  await page.waitForURL('**/app', { timeout: 20_000 });

  // Recherche d'offres (mode démo : des offres fictives sont disponibles).
  await page.goto('/app/offres');
  await page.getByRole('button', { name: 'Rechercher' }).click();
  const firstApply = page.getByRole('button', { name: "J'ai postulé" }).first();
  await expect(firstApply).toBeVisible({ timeout: 20_000 });
  await firstApply.click();

  // Fenêtre « J'ai postulé » : on valide sans email de recruteur.
  await page.getByRole('button', { name: 'Noter ma candidature' }).click();

  // La candidature apparaît dans « Mes candidatures ».
  await page.goto('/app/relances/candidatures');
  await expect(page.locator('li.jz-card').first()).toBeVisible({ timeout: 20_000 });
});
