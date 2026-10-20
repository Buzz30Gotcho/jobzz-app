# Jobzz

> Jobzz trouve les offres de stage, d'alternance et de premier emploi qui te correspondent
> vraiment, et te rappelle de relancer.

Monorepo TypeScript : **Angular** (front), **NestJS + Prisma + PostgreSQL** (back), paquet
**partagé** (schémas Zod, configuration métier). La référence produit complète est dans
[`CLAUDE.md`](./CLAUDE.md) ; le plan technique dans [`docs/PLAN.md`](./docs/PLAN.md).

État : **étape 1 (socle) terminée** — voir le [plan de construction](./docs/PLAN.md#5-étapes-cf-claudemd-14).

## Prérequis

- **Node.js 20+**
- **pnpm 9** (`corepack enable && corepack prepare pnpm@9.15.0 --activate`)
- **Docker** (PostgreSQL + Mailpit ; Ollama en option)

## Démarrage à zéro

```bash
# 1. Services locaux (PostgreSQL + Mailpit)
docker compose up -d

# 2. Configuration
cp .env.example .env            # valeurs par défaut prêtes pour le local

# 3. Dépendances
pnpm install

# 4. Base de données (client Prisma + schéma + migrations)
pnpm --filter @jobzz/api prisma:generate
pnpm --filter @jobzz/api prisma:migrate

# 5. Données de démonstration (facultatif)
pnpm seed

# 6. Lancer le front (4200) et le back (3000) ensemble
pnpm dev
```

- Front : http://localhost:4200
- API : http://localhost:3000/api (ex. http://localhost:3000/api/health)
- **Mailpit** (boîte mail locale) : http://localhost:8025 — tous les mails (vérification,
  réinitialisation…) y arrivent, aucun mail ne part réellement.

### Comptes de démonstration (`pnpm seed`)

| Compte | Plan | Mot de passe |
| --- | --- | --- |
| `demo@jobzz.local` | premium | `demo-jobzz-2026` |
| `gratuit@jobzz.local` | free | `demo-jobzz-2026` |

Le **compte admin** est créé au démarrage de l'API depuis `ADMIN_EMAIL` / `ADMIN_PASSWORD`
(`.env`). Par défaut : `admin@jobzz.local`. Pour le (re)créer : `pnpm create-admin`.

## Scripts (racine)

| Commande | Effet |
| --- | --- |
| `pnpm dev` | Front + back en parallèle |
| `pnpm build` | Build de tous les paquets (ordre topologique) |
| `pnpm lint` | ESLint sur tout le monorepo |
| `pnpm typecheck` | Vérification des types |
| `pnpm test` | Tests unitaires (Vitest) |
| `pnpm seed` | Données de démonstration (bloqué en production) |
| `pnpm create-admin` | Crée / promeut le compte admin |
| `pnpm ai:pull` | Télécharge le modèle Ollama (IA, facultative) |

## Intelligence artificielle (facultative)

Tout fonctionne **sans IA**. Pour l'activer en local :

```bash
docker compose --profile ai up -d   # démarre Ollama (ou installe Ollama sur la machine)
pnpm ai:pull                         # télécharge le modèle (OLLAMA_MODEL)
# puis AI_ENABLED=true dans .env
```

## Paiement (Stripe, mode test) — à venir à l'étape 8

Le code du paiement (Stripe Checkout, portail client, webhooks) sera ajouté à l'étape 8, en
**mode test uniquement** en local. L'application refuse de démarrer si une clé réelle
(`sk_live_…`) est détectée hors production. Réception des webhooks en local avec la Stripe
CLI : `stripe listen --forward-to localhost:3000/api/webhooks/stripe`. Cartes de test :
`4242 4242 4242 4242` (succès), etc. Détails complets à l'étape 8.

## Structure

```
apps/
  api/   NestJS + Prisma + PostgreSQL
  web/   Angular + Tailwind
packages/
  shared/  Zod + config métier + types partagés
docs/      PLAN, DECISIONS, DESIGN, ARCHITECTURE, V2, QUESTIONS, maquettes/
exercices/ Exercices d'apprentissage
```

## Tester l'authentification de bout en bout

1. `pnpm dev`, ouvre http://localhost:4200
2. « Créer mon compte » → l'app s'ouvre, un mail de confirmation arrive dans Mailpit
   (http://localhost:8025)
3. Clique le lien du mail → email confirmé
4. Déconnexion / reconnexion ; « Mot de passe oublié » → mail de réinitialisation dans Mailpit

## Qualité

TypeScript strict, ESLint + Prettier, Vitest. La CI (GitHub Actions) lance lint, types, tests
et build à chaque push / PR. « Terminé » pour une étape = démarrage à zéro fonctionnel, tests
verts, aucune erreur de lint ou de types, README à jour.
