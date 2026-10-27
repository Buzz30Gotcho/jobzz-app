# Jobzz

> Jobzz trouve les offres de stage, d'alternance et de premier emploi qui te correspondent
> vraiment, et te rappelle de relancer.

Monorepo TypeScript : **Angular** (front), **NestJS + Prisma + PostgreSQL** (back), paquet
**partagé** (schémas Zod, configuration métier). La référence produit complète est dans
[`CLAUDE.md`](./CLAUDE.md) ; le plan technique dans [`docs/PLAN.md`](./docs/PLAN.md).

État : **étapes 1 à 7 terminées** (socle, profil & accueil guidé, candidatures & relances, couche
IA, offres, automatisations, **CV**). Voir le [plan de construction](./docs/PLAN.md#5-étapes-cf-claudemd-14).

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
| `pnpm e2e` | Tests de bout en bout (Playwright) — voir ci-dessous |
| `pnpm seed` | Données de démonstration (bloqué en production) |
| `pnpm create-admin` | Crée / promeut le compte admin |
| `pnpm ai:pull` | Télécharge le modèle Ollama (IA, facultative) |

### Tests de bout en bout (Playwright)

Les tests E2E (`apps/web/e2e/`) pilotent la vraie application : inscription → accueil guidé →
recherche → « J'ai postulé », création d'automatisation (depuis le profil et au formulaire), et
support (ticket → réponse admin).

```bash
# Pré-requis une seule fois : navigateur Chromium
pnpm --filter @jobzz/web exec playwright install chromium

# 1. Services + base + comptes démo
docker compose up -d
pnpm --filter @jobzz/api prisma:migrate   # si besoin
pnpm seed

# 2. Lancer les tests (les serveurs API + web démarrent automatiquement, ou sont réutilisés
#    s'ils tournent déjà). Mode conseillé dans .env : JOB_SOURCES_MODE=demo, AI_ENABLED=false,
#    PLAN_ENFORCEMENT=false.
pnpm e2e
```

## Intelligence artificielle (facultative)

Tout fonctionne **sans IA**. Pour l'activer en local :

```bash
docker compose --profile ai up -d   # démarre Ollama (ou installe Ollama sur la machine)
pnpm ai:pull                         # télécharge le modèle (OLLAMA_MODEL)
# puis AI_ENABLED=true dans .env
```

## CV (Profil → Mon CV)

Dépose un **PDF** (5 Mo max) : le texte est extrait (pdf-parse v1), le **fichier n'est jamais écrit
sur disque** (traité en mémoire) — on ne conserve que le texte et une empreinte. Fonctions :

- **analyse par règles** (gratuite) : score /100 + conseils ✅/⚠️ ;
- **comparaison à une offre** par règles (dans le détail d'une offre, onglet Offres → Rechercher) :
  « Ce qui colle / Ce qui manque / Ce que tu peux faire » ;
- **pré-remplissage du profil** : compétences détectées à ajouter en un clic ;
- avec l'IA (Premium, si Ollama est lancé) : analyse approfondie, conseils d'adaptation à l'offre,
  et extraction enrichie (métier, ville, niveau d'études). Sans IA, tout le reste fonctionne.

## Paiement (Stripe, mode test)

Le paiement se fait **uniquement sur les pages de Stripe** : Jobzz ne voit jamais de numéro de
carte. En local, **mode test uniquement** — l'application refuse de démarrer si une clé réelle
(`sk_live_…`) est détectée hors production.

**1. Clés de test** (tableau de bord Stripe → Développeurs → Clés API) dans `.env` :

```
STRIPE_SECRET_KEY=sk_test_…
STRIPE_PUBLISHABLE_KEY=pk_test_…
STRIPE_PRICE_MONTHLY=price_…          # Produit « Premium mensuel » (9,99 €/mois)
STRIPE_PRICE_LAUNCH=price_…           # Produit « Offre de lancement » (6 €/mois)
STRIPE_PRICE_PASS_3_MONTHS=price_…    # Produit « Pass 3 mois » (24,99 €, paiement unique)
PLAN_ENFORCEMENT=true                 # pour voir les pages Tarifs / Mon abonnement
```

Crée les 3 produits/prix dans Stripe (mode test) : deux prix **récurrents mensuels** (mensuel,
lancement) et un prix **unique** (Pass 3 mois). Colle leurs `price_…` ci-dessus.

**2. Webhooks en local** (source de vérité du paiement) avec la Stripe CLI :

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# → copie le « whsec_… » affiché dans STRIPE_WEBHOOK_SECRET, puis redémarre l'API
```

**3. Payer** : `/tarifs` → « Passer Premium » → page Stripe. Cartes de test :

- `4242 4242 4242 4242` — paiement accepté (date future, CVC quelconque) ;
- `4000 0000 0000 9995` — paiement refusé ;
- `4000 0025 0000 3155` — authentification 3D Secure.

Le compte devient Premium **à la réception du webhook** (page « Bienvenue en Premium » qui
patiente). « Mon abonnement » (Profil → Paramètres) ouvre le **portail client Stripe**
(changer de carte, factures, résilier).

Si les clés Stripe sont absentes : les boutons affichent « Paiement non configuré » et le reste
de l'app fonctionne normalement.

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
