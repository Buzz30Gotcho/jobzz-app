import { defineConfig } from 'vitest/config';

// Configuration des exercices d'apprentissage uniquement (CLAUDE.md §15).
// Lance un exercice avec : pnpm exercice <numéro>  (ex. pnpm exercice 01)
export default defineConfig({
  test: {
    include: ['exercices/**/*.test.ts'],
    environment: 'node',
  },
});
