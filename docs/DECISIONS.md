# Décisions techniques

Journal des décisions prises en autonomie (date, décision, raison, alternatives écartées),
conformément au mode de travail du cahier des charges (CLAUDE.md §0).

## 2026-10-22 — Étape 7 (CV) — passe 1

### pdf-parse épinglé en v1.1.1
- **Décision** : extraction du texte PDF avec `pdf-parse@1.1.1`, importé en profondeur
  (`pdf-parse/lib/pdf-parse.js`) pour éviter le code de debug de l'index, avec une déclaration de
  type locale (`apps/api/src/cv/pdf-parse.d.ts`).
- **Alternative écartée** : `pdf-parse@2.x` (installé par défaut), refonte ESM s'appuyant sur
  `pdfjs-dist` + workers, lourde à bundler sous le build webpack CommonJS de NestJS et API
  différente non couverte par `@types/pdf-parse`.
- **Raison** : CLAUDE.md §0 (option la plus simple et cohérente), §7 ; l'API v1 (`pdf(buffer) →
  { text }`) est stable et éprouvée en CommonJS. **À vérifier** si on migre un jour vers une pile ESM.

### Upload CV en mémoire, fichier jamais écrit sur disque
- **Décision** : `FileInterceptor` avec `memoryStorage()` ; on vérifie le type réel (octets `%PDF`),
  la taille (5 Mo), on extrait le texte, on calcule une empreinte SHA-256, puis on ne garde que le
  **texte** et l'empreinte (`CvDocument`). Le binaire n'est jamais persisté.
- **Raison** : CLAUDE.md §4.8 et §9 (fichier supprimé dès que possible, données minimales).

### Sous-navigation du Profil et onglets de vue passés en « segmented control »
- **Décision** : les onglets Relances (À buzzer / Mes candidatures), Offres (Rechercher / Mes
  automatisations) et Profil (Mes infos / Mon CV / Paramètres) deviennent des *segmented controls*
  (cadre `bg-surface-raised`, segment actif relevé), au lieu des onglets soulignés des maquettes.
  Les utilitaires (Aide, Admin, thème, déconnexion) passent du bas de la barre latérale à une
  **barre en haut à droite** avec un menu compte.
- **Raison** : retour utilisateur (PO) — les onglets soulignés ne paraissaient pas cliquables et la
  déconnexion n'était pas là où on l'attend. S'écarte des maquettes, qui restent la référence par
  défaut (CLAUDE.md §11) ; décision produit assumée.

## 2026-10-21 — Étape 6 (automatisations) — passe 2 + correctif majeur

### Bug corrigé : `@UsePipes` au niveau méthode validait aussi `@CurrentUser`/`@Param`
- **Problème** : plusieurs contrôleurs utilisaient `@UsePipes(new ZodValidationPipe(schema))` au
  niveau de la méthode. NestJS applique alors le pipe à **tous** les arguments, y compris
  `@CurrentUser` (l'objet utilisateur) et `@Param` — pas seulement `@Body`. Résultat : toute route
  POST/PUT avec `@CurrentUser` échouait en « Données invalides » (le pipe validait le mauvais
  argument). Touchait profil, candidatures, offres (« J'ai postulé »), IA, automatisations.
- **Correctif** : le pipe est désormais appliqué **au paramètre** `@Body(new ZodValidationPipe(...))`
  (et `@Query(...)` déjà au niveau paramètre). Validé par un test de bout en bout (création
  d'automatisation + envoi du mail).
- **Leçon** : préférer les pipes au niveau paramètre ; les tests unitaires de service ne couvraient
  pas la couche HTTP — d'où la découverte tardive lors du test manuel.

### Exécution : pg-boss au démarrage, robuste
- **Décision** : `QueueService` démarre pg-boss à l'amorçage, planifie `automations.tick` (toutes
  les heures) et exécute `AutomationRunnerService.runAll()`. Si pg-boss ne démarre pas, l'app
  fonctionne quand même (log d'avertissement) ; désactivé en test. Un endpoint `POST
  /automations/run-mine` (forcé) permet de tester l'envoi immédiatement.
- **pg-boss v9** (CommonJS, éprouvé) retenu plutôt que v10 (friction d'interop).

### Mail des offres : HTML maison plutôt que MJML
- **Décision** : le mail est construit par une fonction pure (`offer-digest.template.ts`) en HTML
  à base de tableaux + inline styles (compatible Gmail/Outlook) + version texte + en-tête
  `List-Unsubscribe`. **Divergence assumée vs §7** (qui prévoyait MJML) : MJML 5 ne rendait pas
  correctement et tirait ~150 paquets ; le HTML maison est plus léger et sans dépendance lourde.
- Cadence (`digest-schedule.ts`, testée) : Premium = dès qu'il y a des offres, ≥ 4 h, hors 22 h–7 h ;
  gratuit = lundi 8 h. Désinscription par **jeton HMAC signé** (`unsubscribe-token.ts`, testé).

## 2026-10-21 — Étape 6 (automatisations) — passe 1

### Découpage de l'étape en deux passes
- **Décision** : étape 6 scindée. **Passe 1** (faite) : fondations déterministes et testables —
  schéma de critères (`schemas/automation.ts`, versionné), matrice de faisabilité
  (`data/automation-capabilities.ts`), aide aux alertes externes (`alert-helpers.ts`), moteur
  (`automation-engine.ts`), CRUD + aperçu + page de gestion. **Passe 2** (à venir) : assistant IA
  de création, exécution planifiée (pg-boss), mail des offres (MJML), désinscription.
- **Raison** : éviter un bloc monolithique risqué ; livrer un incrément fonctionnel et testé.

### Critères obligatoires appliqués par le code, jamais par l'IA
- **Décision** : `runAutomation` applique de façon déterministe métier, lieu/rayon, contrat,
  fraîcheur, filtre junior, mots-clés (inclure/indispensables/exclure), compétences indispensables
  et exclusion d'entreprise, puis score ≥ `scoreMin`, et renvoie l'entonnoir. L'IA (passe 2) ne fera
  qu'ajuster le classement (±15), jamais inclure une offre qui viole un critère obligatoire.
- **Raison** : CLAUDE.md §4.6 (honnêteté, déterminisme). Réutilise le score et le filtre junior
  partagés (une seule source de vérité).

### Limite d'automatisations actives via `entitlements.limit` (pas `consume`)
- **Décision** : le nombre d'automatisations actives (1 gratuit / 5 Premium) est vérifié en comptant
  les actives en base contre `entitlements.limit('active_automations')`, pas via `UsageCounter`
  (qui est un compteur par période, inadapté à un décompte « vivant »).
- **Raison** : sémantique correcte ; en local `PLAN_ENFORCEMENT=false` ⇒ limite `null` ⇒ illimité.

### Aide aux alertes : liens et syntaxe isolés (à vérifier)
- **Décision** : modèles d'URL et règles de syntaxe par site dans `alert-helpers.ts` (Indeed,
  LinkedIn, WTTJ, HelloWork, APEC). Le **texte à copier est toujours affiché**, pour fonctionner
  même si un lien casse. Génération par règles (pas d'IA), testée (chaque site).
- **À vérifier** : exactitude des modèles d'URL de chaque site (notés ici, à confronter en ligne).

## 2026-10-21 — UX : thème clair par défaut et disposition

### Thème clair par défaut côté client (divergence assumée vs §11)
- **Décision** : le cahier (§11) prévoyait « thème sombre uniquement en v1 ». Arbitrage produit :
  l'app cliente passe en **thème clair par défaut** (sombre disponible via une bascule mémorisée,
  bouton dans le menu). L'espace **admin reste en noir et blanc** en toutes circonstances.
- **Raison** : la cible est le grand public (étudiants/jeunes diplômés, tous secteurs), pas un
  public tech ; le clair inspire plus de confiance et reste le plus universellement lisible.
- **Mise en œuvre** : palettes en variables CSS — `:root` = clair, `.theme-dark` = sombre,
  `.theme-admin` = B&W complet (son propre fond) ; `ThemeService` applique la classe sur `<html>`,
  par défaut clair (choix explicite mémorisé respecté). L'accent vert de Jobzz est conservé (assombri
  à `#0C8A4B` pour rester lisible en texte sur fond clair, WCAG AA).
- **Alternatives écartées** : suivre `prefers-color-scheme` par défaut (donnait du sombre aux OS en
  mode sombre, contraire au souhait) ; rester sombre uniquement (trop clivant pour la cible).

### Disposition : contenu centré large (~1150 px)
- **Décision** : pages de l'app en `mx-auto w-full max-w-6xl` (centré, marges égales). Le passage à
  une disposition **deux colonnes** (contenu + panneau contextuel) est reporté à l'étape 10
  (Finitions), quand les pages auront plus de contenu.
- **Raison** : équilibre visuel avec la barre latérale, point de lecture stable ; éviter le vide des
  versions étroite-collée-à-gauche et pleine largeur.

## 2026-10-21 — Étape 5 (offres)

### Logique métier des offres en fonctions pures partagées
- **Décision** : score (`offer-score.ts`), filtre junior (`junior-filter.ts`), familles de
  compétences (`data/skill-families.ts`), distance (`geo-distance.ts`) et limite d'offres vues
  (`offer-view-limit.ts`) vivent dans `@jobzz/shared`, testés unitairement (poids/seuils dans la
  config). Le back les orchestre, le front peut réutiliser les libellés de score.
- **Raison** : CLAUDE.md §4.5/§4.7/§13 (fonctions pures testées, une seule source de vérité).

### Recherche manuelle : interrogation des sources à chaud, puis persistance
- **Décision** : `OffersService.search` interroge les sources actives, **upsert** les offres
  (unicité `source + externalId`), applique les filtres obligatoires + junior + compétences, score,
  tri, puis la **limite du jour** via `OfferView` (une offre comptée une fois/jour) et
  `entitlements.limit('offers_viewed')`. Pas de pagination serveur en v1 (cap à 50 résultats).
- **Raison** : simplicité ; la limite ne mord qu'avec `PLAN_ENFORCEMENT=true` (sinon `limit = null`,
  rien n'est flouté). Offres floutées = rang + score seulement, jamais cachées en silence.

### Connecteurs live isolés et gracieux
- **Décision** : `franceTravail` et `laBonneAlternance` ont leurs URLs/paramètres **isolés** dans
  leur fichier (notés « à vérifier »), ne s'activent qu'en `JOB_SOURCES_MODE=live` avec clés, et une
  panne renvoie une **exécution partielle** (message honnête, jamais d'offre inventée). Adzuna reste
  désactivé. Seuls les **mappeurs** (`mapFranceTravailOffers`, `mapLbaOffers`) sont testés (réponses
  enregistrées, aucun appel réseau).
- **Raison** : CLAUDE.md §4.4 ; en local, mode démo (40+ offres fictives, badge « Fictive »).

## 2026-10-21 — Étape 4 (couche IA)

### Abstraction `AiProvider` + Ollama, injectée par jeton
- **Décision** : interface `AiProvider` (`apps/api/src/ai/ai-provider.ts`), implémentation
  `OllamaProvider`, injectée via le jeton `AI_PROVIDER` (`useExisting`). `AiService` enveloppe le
  fournisseur : délais (`AI.messageTimeoutMs`), **nouvelle tentative** sur sortie non conforme au
  schéma Zod, cache par empreinte, journal `AiCallLog` (sans contenu), et `AiUnavailableError` pour
  déclencher le **repli sans IA** chez l'appelant.
- **Raison** : CLAUDE.md §5 (changer de fournisseur sans toucher au reste ; l'IA n'est jamais
  indispensable). Ollama appelé en `format: 'json'` ; la validation stricte reste côté Zod.

### IA activée par `AI_ENABLED` (désactivée par défaut en local)
- **Décision** : `OllamaProvider.isAvailable()` suit `AI_ENABLED`. Le front interroge
  `GET /ai/status` pour n'afficher le bouton « Rédiger avec l'IA » que si l'IA est disponible.
- **Raison** : éviter des appels qui échouent quand Ollama n'est pas lancé ; expérience honnête.

### Message IA : quota consommé seulement en cas de succès, repli sur modèle
- **Décision** : `AiMessagesService.generate` vérifie le droit `ai_message` (Premium), tente l'IA,
  **ne consomme la limite qu'en cas de succès**, et retombe sur `renderMessage` (modèle) si l'IA
  est indisponible. La signature de l'utilisateur est ajoutée **par le code** (jamais inventée).
- **Raison** : CLAUDE.md §2/§4.3/§5 ; ne pas gaspiller un quota sur un échec, toujours fournir un
  message utilisable.

### Sécurité des prompts : données non fiables isolées
- **Décision** : le texte non fiable (entreprise, poste, plus tard offres/CV) est placé dans des
  balises `<donnees> </donnees>` et la consigne système interdit d'exécuter toute instruction qu'il
  contiendrait (`apps/api/src/ai/prompts/message.ts`). Prompts versionnés et testés.
- **Raison** : CLAUDE.md §5 (prévention de l'injection de prompt). Exercice `04-wrap-untrusted`.

## 2026-10-21 — Étape 3 (candidatures et relances)

### « À buzzer » calculé par requête, pas par tâche planifiée
- **Décision** : l'échéance `nextFollowUpAt` est calculée **à la création** de la candidature
  (`computeNextFollowUpAt`, `apps/api/src/followups/follow-up-rule.ts`) ; l'onglet « À buzzer »
  est une simple requête `status = en_attente ET nextFollowUpAt <= maintenant`. Pas de tâche
  pg-boss quotidienne pour l'instant.
- **Raison** : plus simple et plus robuste qu'un job (pas d'état à recalculer, rien à rattraper
  après une panne). pg-boss sera introduit à l'étape 6 pour les automatisations ; si une tâche de
  maintenance des relances devient utile, elle s'ajoutera là.
- **Test** : `follow-up-rule.test.ts` couvre les 7 jours et le décalage samedi/dimanche → lundi.

### Jobzz n'envoie aucun mail : liens d'ouverture de messagerie
- **Décision** : `buildMailLinks` (`packages/shared/src/mail-links.ts`) construit les URLs Gmail,
  Outlook et `mailto` ; le compositeur (`message-composer.component.ts`) ouvre la messagerie de
  l'utilisateur, puis « C'est envoyé ? » enregistre la relance seulement sur confirmation. Au-delà
  de 1 800 caractères d'URL, on bascule sur « Copier ».
- **Raison** : CLAUDE.md §4.3/§4.15 — Jobzz prépare, l'utilisateur envoie. Aucun envoi serveur.

### Doublons de candidatures
- **Décision** : clé = `normalizeKey(entreprise)` + `normalizeKey(poste)` (minuscules, sans accents
  ni ponctuation, sans formes juridiques — fonction déjà testée). « J'ai postulé » sur un doublon
  renvoie la candidature existante avec `duplicate: true` plutôt que d'en créer une seconde.
- **Raison** : CLAUDE.md §4.3.

### Sortie de flux d'une relance
- **Décision** : enregistrer une relance (`relance`, `relance_encore`, `linkedin`) passe la
  candidature en `relancee`, incrémente `followUpCount`, et met `nextFollowUpAt = null` (sort de
  « À buzzer »). Une réponse (`respond`) passe en `reponse_recue` ; l'archivage pose `archivedAt`.
- **Raison** : CLAUDE.md §4.3 (statuts, « Relancer encore » à la demande, pas de 2e relance auto).

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
