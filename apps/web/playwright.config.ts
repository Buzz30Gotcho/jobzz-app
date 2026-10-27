import { defineConfig, devices } from '@playwright/test';

/**
 * Tests de bout en bout (CLAUDE.md §13). Ils pilotent la vraie application :
 * front Angular (4200) qui proxie `/api` vers l'API NestJS (3000), base PostgreSQL
 * et Mailpit lancés par Docker.
 *
 * Pré-requis avant `pnpm e2e` :
 *   1. `docker compose up -d`   (PostgreSQL + Mailpit)
 *   2. `pnpm --filter @jobzz/api prisma:migrate`   (schéma à jour)
 *   3. `pnpm seed`              (comptes démo : demo@jobzz.local, etc.)
 * Les serveurs API + web sont démarrés automatiquement (ou réutilisés s'ils tournent).
 * Mode conseillé : JOB_SOURCES_MODE=demo, AI_ENABLED=false, PLAN_ENFORCEMENT=false.
 */
export default defineConfig({
  testDir: './e2e',
  // Base de données partagée : un seul worker pour éviter les courses de données.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    locale: 'fr-FR',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'pnpm --filter @jobzz/api dev',
      url: 'http://localhost:3000/api/health',
      reuseExistingServer: true,
      timeout: 180_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'pnpm --filter @jobzz/web dev',
      url: 'http://localhost:4200',
      reuseExistingServer: true,
      timeout: 180_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
});
