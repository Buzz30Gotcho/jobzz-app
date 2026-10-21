# Jobzz — Plan de construction

Ce document décrit l'architecture, la structure des dossiers, le modèle de données et les étapes.
Il est vivant : il sera complété au fur et à mesure. La référence produit reste `CLAUDE.md`.

## 1. Architecture générale

Monorepo **pnpm** avec trois paquets :

```
jobzz/
├── apps/
│   ├── api/        NestJS + Prisma + PostgreSQL (back-end)
│   └── web/        Angular (dernière version stable) + Tailwind (front-end)
├── packages/
│   └── shared/     Schémas Zod, types, config métier typée, constantes partagées
├── docs/           PLAN, DECISIONS, DESIGN, ARCHITECTURE, V2, QUESTIONS, maquettes/
├── exercices/      Exercices d'apprentissage (section 15 du cahier des charges)
├── docker-compose.yml   PostgreSQL, Mailpit, Ollama (profil `ai`)
├── .github/workflows/   CI (lint, types, tests, build)
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── .env.example
```

**Principes techniques** (cf. CLAUDE.md §7) : TypeScript partout, validation Zod partagée,
Prisma + PostgreSQL, pg-boss pour les tâches de fond, Stripe pour le paiement,
dates en UTC en base / règles métier en `Europe/Paris`, interface en français.

## 2. Flux de données

```
Angular (signals + HttpClient)
   │  REST JSON, JWT (15 min, en mémoire) + refresh (cookie httpOnly, rotation)
   ▼
NestJS (un module par domaine) ── Zod (packages/shared) ── Prisma ── PostgreSQL
   │
   ├── pg-boss (automatisations, relances, nettoyage)
   ├── AiProvider (Ollama) — jamais indispensable
   ├── JobSource (France Travail, La bonne alternance, démo)
   ├── MailSender (Nodemailer + MJML → Mailpit en local)
   └── Stripe (Checkout, portail, webhooks) — mode test en local
```

## 3. Modèle de données

Entités Prisma complètes définies dès l'étape 1 (cf. CLAUDE.md §6) :
`User`, `SubscriptionPeriod`, `StripeEvent`, `JobOutcome`, `RefreshToken`, `EmailToken`,
`Profile`, `Application`, `FollowUp`, `Offer`, `OfferEnrichment`, `Company`,
`OfferInteraction`, `Automation`, `AutomationRun`, `AutomationMatch`, `OfferDigest`,
`UsageCounter`, `OfferView`, `CvDocument`, `CvAnalysis`, `CvOfferComparison`,
`Ticket`, `TicketMessage`, `AiCallLog`.

Toutes les tables : `id` (UUID), `createdAt`, `updatedAt`, index sur clés étrangères et
colonnes de filtre/tri.

## 4. Modules back-end (NestJS)

`auth`, `users`, `profile`, `applications`, `followups`, `offers`, `sources`, `scoring`,
`automations`, `ai`, `cv`, `mail`, `support`, `admin`, `entitlements`, `billing`, `privacy`.

## 5. Étapes (cf. CLAUDE.md §14)

1. **Socle** ✅ : monorepo, Docker Compose, NestJS, Prisma (schéma complet),
   authentification complète, rôles, création admin, module `entitlements` (désactivé),
   Angular (squelette, design system, mise en page, thème admin), page d'accueil publique,
   pages d'authentification, CI, seed démo.
2. **Profil et accueil guidé** ✅ : référentiels communes (geo.api.gouv.fr) et métiers ROME
   (France Travail, repli saisie libre), module `profile` (GET/PUT, complétude), formulaire de
   profil (widgets métiers/villes/compétences), accueil guidé en 3 écrans (`/app/bienvenue`).
3. **Candidatures et relances** ✅ : modules `applications`/`followups`, règle d'échéance (7 j,
   week-end → lundi), statuts et « L'entreprise a répondu », modèles de messages, compositeur
   d'envoi (Gmail/Outlook/mailto/copier) avec confirmation, autre canal LinkedIn, envoi libre,
   page Relances (À buzzer + Mes candidatures), tableau de bord (buzz du jour, récap semaine).
4. **Couche IA** ✅ : abstraction `AiProvider` + fournisseur Ollama, `AiService` (délais, retry sur
   sortie invalide, validation Zod, cache, journal `AiCallLog`, repli), prompts versionnés et
   sécurisés (données non fiables en balises), messages de relance/envoi libre rédigés par l'IA
   (Premium) avec repli sur modèle, bouton « Rédiger avec l'IA » et indicateur IA côté site.
5. **Offres** ✅ : connecteurs `JobSource` (démo, France Travail, La bonne alternance isolés et
   gracieux, Adzuna désactivé), normalisation + dédoublonnage, enrichissement par règles, score
   déterministe et filtre junior (fonctions pures testées), limite d'offres vues/jour (gratuit),
   page Offres (Rechercher), « J'ai postulé » relié aux relances, « Masquer », gestion des pannes.
6. Automatisations.
7. CV.
8. Paiement (mode test).
9. Support, admin et données.
10. Finitions.
11. Bonus.

## 6. Détail de l'étape 1 (Socle)

### 6.1 Infrastructure monorepo
- `pnpm-workspace.yaml`, `tsconfig.base.json`, `.gitignore`, `.env.example`, `.prettierrc`,
  ESLint partagé, scripts racine (`dev`, `build`, `lint`, `test`, `seed`).
- `docker-compose.yml` : PostgreSQL 16, Mailpit, Ollama (profil `ai`).

### 6.2 packages/shared
- `config.ts` : toutes les valeurs métier (délais de relance, limites, poids du score,
  fréquences, tailles de fichiers…) — source unique.
- Schémas Zod d'authentification et de profil, types partagés, constantes (plans, rôles).

### 6.3 apps/api (NestJS)
- Prisma : schéma complet + première migration + client généré.
- `PrismaModule`, `ConfigModule` (validation des variables d'env, refus des clés `sk_live_`
  hors production).
- `auth` : inscription (argon2id, mdp ≥ 10), vérification email (jeton 48 h, 3/h),
  connexion (JWT 15 min + refresh opaque 30 j, rotation, cookie httpOnly/Secure/SameSite=Lax),
  rafraîchissement, déconnexion (révocation), mot de passe oublié (jeton 1 h, révocation des
  sessions). Rate limiting, Helmet, CORS restreint, validation Zod, gardes de rôle.
- `entitlements` : `can`, `limit`, `consume`, `UsageCounter` ; piloté par `PLAN_ENFORCEMENT`
  (désactivé par défaut : tout le monde Premium).
- `mail` : interface `MailSender` + Nodemailer (Mailpit), gabarits (vérification, reset).
- Création du compte admin au démarrage (`ADMIN_EMAIL`/`ADMIN_PASSWORD`) + commande
  `create-admin`.
- Seed démo (`pnpm seed`), bloqué en production.
- Tests Vitest (entitlements avec `PLAN_ENFORCEMENT` true/false, auth).

### 6.4 apps/web (Angular)
- Squelette standalone + signals + routes paresseuses + Reactive Forms typés.
- Tailwind + design system (variables CSS §11), polices auto-hébergées (Fontsource),
  thème sombre, thème admin noir/blanc, icônes lucide-angular.
- Mise en page application (navigation latérale 4 entrées + barre du bas mobile, bouton « ? »).
- Page d'accueil publique, pages d'authentification (connexion, inscription, vérifier email,
  mot de passe oublié, réinitialisation), service d'auth (JWT en mémoire + refresh),
  intercepteur HTTP, garde de route.

### 6.5 CI
- GitHub Actions : install, lint, typecheck, test, build (api + web + shared).

### « Terminé » pour l'étape 1
Démarrage à zéro (`docker compose up`, `pnpm install`, migrations, `pnpm dev`),
inscription → mail de vérification (Mailpit) → connexion fonctionnelles, tests verts,
lint/types OK, README à jour, commits poussés.

## 7. Décisions notables
Consignées au fil de l'eau dans `docs/DECISIONS.md`.
