# Architecture

Document vivant. Vue d'ensemble à jour à la fin de l'**étape 10**.

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

### Modules ajoutés aux étapes 2 à 10
- `profile` — profil (métiers/ROME, lieux, contrats, compétences…) ; route dédiée
  `POST /profile/skills` (fusion sans écraser) ; `PATCH /profile/offer-mail`.
- `referentials` — ROME (France Travail) et communes (geo.api.gouv.fr), mis en cache.
- `applications` + helper `followups/follow-up-rule.ts` — candidatures, relances, règle des
  7 jours (échéance décalée le week-end), statuts, envoi libre.
- `ai` — abstraction `AiProvider` (Ollama par défaut), sortie JSON validée Zod, cache, délais,
  repli sans IA ; prompts versionnés (`ai/prompts/`).
- `sources` — connecteurs `JobSource` (`demo`, `franceTravail`, `laBonneAlternance`, `adzuna`
  désactivé), normalisation `NormalizedOffer`, dédoublonnage ; enrichissement d'entreprise.
- `offers` — recherche manuelle (filtres obligatoires + score), « J'ai postulé », masquage,
  limite des offres vues (gratuit) ; enrichissement d'offre.
- `automations` — critères (schéma versionné), moteur déterministe + entonnoir, aide aux
  alertes externes, aperçu/prévision, exécution horaire (`queue.service.ts`, pg-boss) et mail
  des offres (HTML + cadence), désinscription par jeton signé.
- `cv` — dépôt PDF **en mémoire** (pdf-parse), analyse par règles + IA, comparaison CV ↔ offre,
  pré-remplissage du profil ; le fichier n'est jamais écrit sur disque.
- `billing` — Stripe (Checkout, portail, webhooks idempotents `StripeEvent`), offre de
  lancement, tâche quotidienne (`billing-schedule.service.ts`, pg-boss).
- `support` — FAQ (`content/faq.md`), tickets + pièces jointes images (servies auteur + admin).
- `admin` (étendu) — santé système, statistiques, utilisateurs, tickets (`@Roles('admin')`).
- `privacy` — export ZIP (archiver) et suppression de compte (cascade Prisma).
- `outcomes` — « J'ai trouvé ! » (`JobOutcome`, mise en pause des automatisations).

### Cœurs purs (dans `packages/shared`, testés, sans framework)
`offer-score`, `junior-filter`, `entitlements`, `billing`, `admin-stats`, critères et
capacités d'automatisation, `alert-helpers`, `cv-analysis` : logique métier testable isolément,
réutilisée côté API.

### Tâches de fond (pg-boss)
Planifiées au démarrage de l'API : `automations.tick` (horaire, recherche + score + mail) et
`billing.daily` (expiration des Pass 3 mois, préavis 7 j). Files et nouvelles tentatives gérées
par pg-boss sur la même base PostgreSQL.

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
- `AuthService` (signals) : JWT en mémoire, user signal. Restauration de session au démarrage
  via `provideAppInitializer`, mais `/auth/refresh` n'est appelé que si un **indice de session**
  non sensible existe (`localStorage jz_has_session`, posé à la connexion, retiré à la
  déconnexion/au 401) — évite un 401 inutile pour les visiteurs anonymes. Aucun jeton stocké.
- `authInterceptor` : ajoute le Bearer + `withCredentials`, rejoue une fois après un 401 (refresh).
- Gardes : `authGuard`, `adminGuard`, `guestGuard`.
- Layouts : `public-layout`, `auth-layout`, `app-shell` (navigation 4 entrées + barre du bas
  mobile + « ? » + entrée Admin pour l'admin + **palette de commandes `Ctrl/Cmd+K`**),
  `admin-shell` (thème noir et blanc).
- Thèmes : **clair par défaut** + bascule clair/sombre (`ThemeService`), admin forcé en N&B.
  Variables CSS (`styles.css`) réglées pour WCAG AA (voir `docs/DESIGN.md`).
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

## Tests

- **Unitaires** (Vitest) : cœurs purs de `packages/shared` (score, filtre junior, entitlements,
  billing, admin-stats…) et services API (relances, offres, support, privacy, webhooks Stripe
  signés, etc.). `pnpm test`.
- **Bout en bout** (Playwright, `apps/web/e2e/`) : 4 parcours (CLAUDE.md §13) — inscription →
  accueil guidé → recherche → « J'ai postulé » ; automatisation depuis le profil ; automatisation
  au formulaire avec aperçu ; ticket → réponse admin. `workers: 1` (base partagée), serveurs
  démarrés/réutilisés automatiquement. `pnpm e2e` (voir README).
- **Qualité** : ESLint + Prettier, TypeScript strict, `pnpm lint` / `pnpm typecheck`.
