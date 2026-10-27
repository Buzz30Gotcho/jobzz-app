import { expect, test } from '@playwright/test';
import { ADMIN_EMAIL, ADMIN_PASSWORD, login, logout, register, uniqueEmail } from './helpers';

/**
 * Support (CLAUDE.md §13) : un utilisateur crée un ticket, l'admin le retrouve et y répond.
 */
test('un utilisateur ouvre un ticket, l\'admin répond', async ({ page }) => {
  const email = uniqueEmail('ticket');
  const subject = `Souci E2E ${Date.now()}`;

  // L'utilisateur crée une demande.
  await register(page, email);
  await page.goto('/app/aide/demandes');
  await page.getByRole('button', { name: 'Nouvelle demande' }).click();
  await page.locator('#subject').fill(subject);
  await page.locator('#message').fill("Bonjour, j'ai une question sur Jobzz. Merci !");
  await page.getByRole('button', { name: 'Envoyer' }).click();
  // La demande apparaît dans la liste de l'utilisateur.
  await expect(page.getByText(subject)).toBeVisible({ timeout: 20_000 });

  await logout(page);

  // L'admin retrouve le ticket et y répond.
  await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto('/admin/tickets');
  await page.getByText(subject).click();
  await page.waitForURL('**/admin/tickets/**', { timeout: 20_000 });
  await page.locator('textarea').fill('Bonjour, merci pour ton message. On regarde ça !');
  await page.getByRole('button', { name: 'Répondre' }).click();
  await expect(page.getByText('On regarde ça !')).toBeVisible({ timeout: 20_000 });
});
