# Architecture

Document vivant, complété à chaque étape. Vue d'ensemble à la fin de l'étape 1.

## Monorepo

- `packages/shared` — code partagé **sans dépendance au framework** : configuration métier
  (`config.ts`), constantes, schémas Zod, cœur des droits (`entitlements.ts`), types publics.
  Compilé en CommonJS ; consommé par l'API et le front.
- `apps/api` — NestJS (un module par domaine), Prisma, PostgreSQL.
- `apps/web` — Angular (standalone, signals), Tailwind.

## Back-end (NestJS)

### Modules présents à l'étape 1
- `config` — validation Zod des variables d'env (`AppConfigService`), refus des clés
  `sk_live_` hors production.
- `prisma` — `PrismaService` (global), connexion/déconnexion gérées par le cycle de vie Nest.
- `mail` — abstraction `MailSender` + implémentation Nodemailer (Mailpit en local), gabarits.
- `entitlements` — `can` / `limit` / `consume` au-dessus du cœur pur de `shared` + `UsageCounter`.
- `users` — accès utilisateur, sérialisation publique, `lastActiveAt` (max 1×/h).
- `auth` — inscription, vérification email, connexion, rafraîchissement (rotation), déconnexion,
  mot de passe oublié/réinitialisation. Argon2id, jetons opaques hachés.
- `admin` — création du compte admin au démarrage (`AdminBootstrapService`).
- `health` — `/api/health` (état base, mode sources, PLAN_ENFORCEMENT).

### Gardes globales
1. `ThrottlerGuard` — limitation de débit (avec `@Throttle` renforcé sur l'auth).
2. `JwtAuthGuard` — exige un JWT valide, sauf routes `@Public()`.
3. `RolesGuard` — `@Roles('admin')` vérifié côté serveur.

### Sécurité
Helmet, CORS restreint au front, cookies httpOnly/SameSite=Lax, validation Zod de toutes les
entrées (`ZodValidationPipe`), logs pino sans données personnelles (`authorization`/`cookie`
masqués).

### Temps
`src/common/time.ts` : conversions Europe/Paris (début de jour/semaine/mois) en instants UTC,
pour les compteurs d'usage et (à venir) les échéances de relance et les heures calmes des mails.

## Front-end (Angular)

- Bootstrap standalone (`main.ts`, `app.config.ts`), routes paresseuses (`app.routes.ts`).
- `AuthService` (signals) : JWT en mémoire, user signal, restauration de session au démarrage
  via `provideAppInitializer` (appel `/auth/refresh`).
- `authInterceptor` : ajoute le Bearer + `withCredentials`, rejoue une fois après un 401 (refresh).
- Gardes : `authGuard`, `adminGuard`, `guestGuard`.
- Layouts : `public-layout`, `auth-layout`, `app-shell` (navigation 4 entrées + barre du bas
  mobile + « ? » + entrée Admin pour l'admin), `admin-shell` (thème noir et blanc).
- Design system : variables CSS + Tailwind, polices auto-hébergées (Fontsource), icônes lucide.

## Flux d'authentification

```
POST /api/auth/register|login
  → crée l'utilisateur / vérifie le mot de passe (argon2id)
  → JWT d'accès (15 min) renvoyé dans le corps (gardé en mémoire au front)
  → refresh opaque (30 j) posé en cookie httpOnly, haché en base
POST /api/auth/refresh (cookie)  → rotation : ancien révoqué, nouveau émis
POST /api/auth/logout            → révoque le refresh, efface le cookie
```

## Base de données

Schéma Prisma complet dès l'étape 1 (toutes les entités de CLAUDE.md §6), même celles utilisées
plus tard (offres, automatisations, CV, abonnements…). Index sur les clés étrangères et les
colonnes de filtre/tri.
