# Décisions techniques

Journal des décisions prises en autonomie (date, décision, raison, alternatives écartées),
conformément au mode de travail du cahier des charges (CLAUDE.md §0).

## 2026-10-21 — Étape 2 (profil et accueil guidé)

### Schéma de profil : tout facultatif à l'enregistrement
- **Décision** : `profileUpdateSchema` (`packages/shared/src/schemas/profile.ts`) rend **tous** les
  champs facultatifs à l'enregistrement (valeurs par défaut, chaînes vides → `null`). La contrainte
  « métier/contrat/ville/date obligatoires » est portée par l'accueil guidé et par la recherche
  (étape 5), pas par le `PUT /profile`.
- **Raison** : on n'empêche jamais de sauvegarder un profil partiel (principe « ne jamais perdre de
  données », divulgation progressive). Les codes ROME sont validés (`^[A-Z]\d{4}$`) pour qu'ils ne
  soient jamais inventés.
- **Alternatives écartées** : exiger les champs obligatoires côté schéma → bloquerait les sauvegardes
  intermédiaires de l'accueil guidé.

### Complétude du profil : fonction pure partagée
- **Décision** : `computeProfileCompletion` (`packages/shared/src/profile-completion.ts`), testée,
  renvoie un pourcentage et des **pastilles neutres** (jamais rouges). Elle prend `hasCv` en entrée
  (le CV n'est pas dans le profil ; branché à l'étape 7). Calcul côté serveur, affiché page Profil.
- **Raison** : CLAUDE.md §4.2 ; une seule source de vérité, réutilisable front/back.

### Référentiels : communes complètes, ROME gracieux
- **Décision** : module `referentials` (`apps/api/src/referentials/`). **Communes** via
  geo.api.gouv.fr (sans clé, pleinement fonctionnel en local). **Métiers ROME** via l'API France
  Travail : si les clés sont absentes (défaut local), la recherche renvoie `[]` et le front bascule
  sur la **saisie libre** (aucun code ROME inventé). Cache mémoire TTL (7 j) partagé.
- **À vérifier** : URLs et noms de champs de l'API ROME France Travail (jeton OAuth2
  *client credentials*, endpoint de requête métiers), **isolés dans `rome.service.ts`** — à
  confronter à la doc officielle à l'étape 5. Les mappeurs (`mapGeoCommunes`, `mapRomeJobs`) sont des
  fonctions pures testées avec des réponses enregistrées (aucun appel réseau dans les tests).

### Accueil guidé : prénom d'abord, 3 écrans passables
- **Décision** : `/app/bienvenue` (`onboarding.component.ts`), 3 écrans chacun passable ; le profil
  est enregistré au passage de l'écran 2 (compétences) puis à la fin. L'inscription redirige
  désormais vers l'accueil guidé. L'écran 3 (automatisations) est **informatif** : les
  automatisations arrivent à l'étape 6 — rien n'est promis ni simulé (honnêteté, §1).
- **Raison** : CLAUDE.md §3 ; « créer doit prendre quelques secondes », divulgation progressive.

### Formulaire de profil : réactif pour les scalaires, signals pour les listes
- **Décision** : la page Profil (`pages/app/profil/`) combine un `FormGroup` typé (champs simples)
  et des **composants sur mesure** pilotés par signals (`metier-field`, `commune-field`,
  `tags-field`) avec liaison `[(value)]` via `model()`.
- **Raison** : les widgets de liste (métiers ROME, villes + rayon, pastilles de compétences) sont
  plus clairs en signals qu'en `FormArray` ; le reste reste en Reactive Forms typés (§7).
- **Alternatives écartées** : tout en `FormArray` (verbeux, moins lisible) ; Angular CDK Overlay pour
  les listes déroulantes (reporté : une liste positionnée en `relative/absolute` suffit en v1).

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
