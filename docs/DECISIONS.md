# Décisions techniques

Journal des décisions prises en autonomie (date, décision, raison, alternatives écartées),
conformément au mode de travail du cahier des charges (CLAUDE.md §0).

## 2026-10-20 — Étape 1 (socle)

### Gestionnaire de paquets et monorepo
- **Décision** : pnpm workspaces (`apps/*`, `packages/*`), pnpm 9.15.0 figé via `packageManager`.
- **Raison** : imposé par le cahier des charges (§7) ; pnpm gère bien les dépendances croisées.

### Paquet partagé compilé en CommonJS
- **Décision** : `@jobzz/shared` est compilé en CommonJS vers `dist/`, et c'est ce `dist` que
  consomment l'API et le front (jamais les sources `.ts` directement).
- **Raison** : évite les frictions d'interopérabilité ESM/CJS avec les outils standards de
  NestJS (tsc, CommonJS) ; Angular (esbuild) consomme très bien du CommonJS. La CI et les
  scripts `build`/`dev` construisent toujours `shared` en premier (ordre topologique de pnpm).
- **Alternatives écartées** : `shared` en ESM pur (problèmes de `require` depuis l'API CJS) ;
  alias TypeScript vers les sources (erreurs `rootDir` au build NestJS, résolution fragile).

### Outillage NestJS standard (pas de tsx en dev)
- **Décision** : `nest start --watch` en dev, `nest build` (tsc) pour le build.
- **Raison** : NestJS s'appuie sur `emitDecoratorMetadata` pour l'injection par type ; esbuild
  (tsx) ne l'émet pas de façon fiable. L'outillage officiel évite les surprises d'injection.
- **tsx** reste utilisé uniquement pour les scripts hors runtime Nest (seed, create-admin, ai:pull).

### Jetons de session
- **Décision** : JWT d'accès (15 min) renvoyé au front (gardé en mémoire), jeton de
  rafraîchissement **opaque** (aléatoire, haché SHA-256 en base) dans un cookie
  httpOnly/SameSite=Lax, avec rotation à chaque usage.
- **Raison** : conforme à CLAUDE.md §4.1. Le refresh opaque permet la révocation immédiate ;
  le hachage évite d'exposer les jetons en cas de fuite de la base.

### Validation d'environnement et refus de `sk_live_`
- **Décision** : validation Zod des variables d'env au démarrage ; refus de démarrer si une clé
  `sk_live_` est présente hors production.
- **Raison** : sécurité (CLAUDE.md §2.1) : aucun vrai paiement possible par erreur en local.

### Cœur des droits (entitlements) dans `shared`, persistance dans l'API
- **Décision** : les fonctions pures `resolveLimit` / `canConsume` vivent dans `@jobzz/shared`
  (testables sans base) ; le service NestJS y ajoute le comptage `UsageCounter`.
- **Raison** : testabilité, réutilisation côté front possible plus tard, séparation nette.

### Normalisation de l'email (une seule fonction partout)
- **Décision** : une fonction unique `normalizeEmail` dans `@jobzz/shared` (trim + minuscules)
  est appliquée partout : dans les schémas Zod (inscription, connexion, mot de passe oublié,
  renvoi du lien de vérification), **avant** la validation du format, et dans l'API avant chaque
  enregistrement ou recherche en base (`UsersService.findByEmail`, création à l'inscription,
  création/recherche du compte admin).
- **Raison** : éviter qu'une casse ou des espaces créent des comptes distincts ou empêchent de
  retrouver un compte. « Fred@Gmail.com » et « fred@gmail.com » désignent le même compte.
- **Test** : `packages/shared/src/normalize-email.test.ts` (dont le cas « Fred@Gmail.com » ↔
  « fred@gmail.com »).

### Prénom facultatif et accueil personnalisé
- **Décision** : un champ **facultatif « Ton prénom »** est ajouté en premier à l'écran 1 de
  l'accueil guidé (pré-rempli s'il est connu, modifiable ensuite dans Profil → Mes infos). Le
  tableau de bord affiche « Salut {prénom} », ou « Salut ! » s'il n'y en a pas. **Jamais de nom
  d'utilisateur.**
- **Mise en œuvre (socle)** : `PublicUser` porte désormais `firstName: string | null`, renseigné
  depuis `Profile.firstName` dans `toPublicUser` (login, inscription, rafraîchissement, `/me`).
  Le tableau de bord (`dashboard.component.ts`) calcule le message d'accueil à partir de ce
  champ. L'écran de saisie du prénom lui-même viendra avec l'accueil guidé (étape 2).
- **Raison** : personnalise l'expérience sans jamais imposer d'information ni introduire de pseudo.

### Fuseau horaire
- **Décision** : dates en UTC en base ; conversions Europe/Paris via `Intl.DateTimeFormat`
  (sans dépendance externe), testées sur l'heure d'été et d'hiver.
- **Raison** : CLAUDE.md §7 ; éviter une dépendance supplémentaire pour une logique bien cadrée.

### Front : Angular 19, Tailwind 3, icônes curées
- **Décision** : Angular 19 (standalone, signals, `@if/@for`, `provideAppInitializer`),
  Tailwind CSS v3 via PostCSS, lucide-angular avec un jeu d'icônes **sélectionné** (pas tout le
  paquet) pour limiter le bundle. Pas d'Angular Material.
- **Raison** : CLAUDE.md §7 ; Tailwind v3 est le plus stable/documenté avec Angular aujourd'hui.

### `prisma.config.ts` au lieu de `package.json#prisma`
- **Décision** : configuration Prisma dans `apps/api/prisma.config.ts`, qui charge le `.env`
  **racine** du monorepo via dotenv.
- **Raison** : secrets uniquement à la racine (§9) ; supprime l'avertissement de dépréciation
  de la clé `package.json#prisma` (Prisma 7).

## À vérifier (hypothèses isolées)

- Noms exacts des paramètres des API France Travail / La bonne alternance : à confronter à la
  doc officielle lors de l'étape 5 (isolés dans les connecteurs).
- Modèles de liens et syntaxe des alertes (Indeed, LinkedIn…) : à vérifier à l'étape 6
  (`alert-helpers.ts`).
