# Exercices d'apprentissage

Tu réécris toi-même une fonction déjà présente dans l'application, puis tu vérifies avec les
mêmes tests. La vraie version tourne déjà dans l'app ; ici, tu t'entraînes sans la regarder.

## Comment faire

1. Ouvre `exercices/<numéro>-<nom>/start.ts` et complète les fonctions (remplace les `TODO`).
2. Lance les tests de cet exercice :

   ```bash
   pnpm exercice <numéro>      # ex. pnpm exercice 01
   ```

   (le numéro filtre le chemin des fichiers de test : `01` cible `01-entitlements`.)

3. Tout est vert → bravo. Compare ensuite avec la version de l'app (indiquée dans l'en-tête du
   fichier) pour voir les différences.

## Liste

| Nº | Nom | Ce que tu implémentes | Version de référence |
| --- | --- | --- | --- |
| 01 | entitlements | Résolution d'une limite selon le plan + comptage | `packages/shared/src/entitlements.ts` |
| 02 | suggest-skills | Suggestions de compétences par domaine (insensible aux accents, dédoublonnage) | `packages/shared/src/data/skill-suggestions.ts` |
| 03 | render-template | Remplacement des variables {xxx} d'un modèle de message | `packages/shared/src/data/message-templates.ts` |
| 04 | wrap-untrusted | Isoler les données non fiables dans un prompt IA (balises `<donnees>`) | `apps/api/src/ai/prompts/message.ts` |
| 05 | junior-filter | Décider si une offre est gardée pour un profil junior (titre) | `packages/shared/src/junior-filter.ts` |
