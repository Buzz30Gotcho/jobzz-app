# Questions d'apprentissage

Difficulté progressive. La réponse est cachée : déplie le bloc quand tu veux vérifier.

## Étape 3 — Candidatures et relances

### 1. (repérage) Où est codée la règle « relancer 7 jours après, décalée au lundi si week-end » ?

<details>
<summary>Réponse</summary>

Dans `apps/api/src/followups/follow-up-rule.ts` (`computeNextFollowUpAt`). Le délai (7 jours) et le
décalage week-end viennent de `FOLLOW_UP` dans `packages/shared/src/config.ts`. Le jour de la
semaine à Paris est donné par `isoWeekdayParis` (`apps/api/src/common/time.ts`). Testé dans
`follow-up-rule.test.ts` (semaine, samedi, dimanche). Exercice proche : `03-render-template`.

</details>

### 2. (pourquoi) Pourquoi Jobzz n'envoie-t-il pas lui-même les mails de relance ?

<details>
<summary>Réponse</summary>

Choix produit (CLAUDE.md §1, §4.3, §4.15) : « l'outil prépare, l'utilisateur valide ». Jobzz
construit le message et ouvre la messagerie de l'utilisateur via des liens (`buildMailLinks`,
`packages/shared/src/mail-links.ts`) — Gmail, Outlook, `mailto`. Au retour, « C'est envoyé ? »
enregistre la relance seulement si l'utilisateur confirme. Avantages : pas de configuration SMTP au
nom de l'utilisateur, pas de risque d'envoi non voulu, le mail part de sa vraie adresse.

</details>

### 3. (technique) Comment un utilisateur est-il empêché d'agir sur la candidature d'un autre ?

<details>
<summary>Réponse</summary>

Chaque méthode de `ApplicationsService` filtre par `userId`. Pour les actions sur une candidature
précise (relance, réponse, archive), `requireOwned(userId, id)` fait un `findFirst({ where: { id,
userId } })` et lève `NotFoundException` si rien ne correspond — un identifiant appartenant à
quelqu'un d'autre est donc traité comme introuvable. Les listes (`list`, `due`) n'interrogent que
les lignes de l'utilisateur courant (injecté depuis le JWT via `@CurrentUser`).

</details>

## Étape 2 — Profil et accueil guidé

### 1. (repérage) Dans quel fichier décide-t-on des compétences proposées « en un clic » selon le métier ?

<details>
<summary>Réponse</summary>

Dans `packages/shared/src/data/skill-suggestions.ts` : la table `SKILL_DOMAINS` (un domaine =
mots-clés déclencheurs + compétences) et la fonction pure `suggestSkills(jobLabels)`. Elle est
utilisée côté front dans la page Profil et l'accueil guidé (`skillSuggestions()`), et testée dans
`skill-suggestions.test.ts`. Exercice associé : `exercices/02-suggest-skills/`.

</details>

### 2. (pourquoi) Pourquoi la recherche de métiers renvoie-t-elle une liste vide en local au lieu d'une erreur ?

<details>
<summary>Réponse</summary>

Parce que les clés France Travail ne sont pas configurées par défaut (`.env`). `RomeService`
(`apps/api/src/referentials/rome.service.ts`) renvoie alors `[]`, et le composant `metier-field`
bascule sur la **saisie libre** : le libellé saisi devient un métier sans code ROME. On ne veut
jamais **inventer** de code ROME (CLAUDE.md §4.2), et une panne de référentiel ne doit jamais
bloquer l'utilisateur (§4.4). Les communes, elles, viennent de geo.api.gouv.fr (sans clé) et
fonctionnent en local.

</details>

### 3. (technique) Comment le `PUT /profile` crée-t-il le profil s'il n'existe pas encore, en une seule requête ?

<details>
<summary>Réponse</summary>

Via `prisma.profile.upsert` dans `ProfileService.update` (`apps/api/src/profile/profile.service.ts`) :
la clé `where: { userId }` cherche le profil ; `create` l'ajoute (avec `userId`) s'il est absent,
`update` le modifie sinon. Les mêmes champs (`fields`) servent aux deux, et les chaînes de date
`AAAA-MM-JJ` sont converties en `Date` UTC à minuit. La réponse repasse par `toPublicProfile` qui
normalise les champs JSON et calcule la complétude. Test : `profile.service.test.ts`.

</details>

## Étape 1 — Socle

### 1. (repérage) Où est défini le fait qu'une inscription libre devient une inscription sur invitation ?

<details>
<summary>Réponse</summary>

Dans la variable d'environnement `BETA_INVITE_CODE` (validée dans
`apps/api/src/config/env.ts`), utilisée par `AuthService.register`
(`apps/api/src/auth/auth.service.ts`) : si le code est renseigné et ne correspond pas, l'inscription
est refusée. Vide (défaut) → inscription libre.

</details>

### 2. (pourquoi) Pourquoi le jeton de rafraîchissement est-il « opaque » et haché en base, alors que le jeton d'accès est un JWT ?

<details>
<summary>Réponse</summary>

Le JWT d'accès est court (15 min) et **auto-vérifiable** (signature), donc pratique mais non
révocable individuellement. Le refresh (30 j) doit pouvoir être **révoqué immédiatement**
(déconnexion, changement de mot de passe) et **tourné** à chaque usage : on le stocke donc en base.
On n'y garde que son **empreinte SHA-256** (`apps/api/src/auth/tokens.ts`) pour qu'une fuite de la
base ne révèle aucun jeton utilisable. Voir `RefreshToken` dans le schéma Prisma et
`AuthService.refresh` (rotation : l'ancien est révoqué, un nouveau est émis).

</details>

### 3. (technique) Comment `startOfWeekParis` donne-t-il le bon lundi même pendant le changement d'heure ?

<details>
<summary>Réponse</summary>

`apps/api/src/common/time.ts` lit d'abord l'« horloge murale » de Paris via
`Intl.DateTimeFormat` (`wallClockInZone`), puis reconstruit l'instant UTC du minuit parisien avec
`zonedWallClockToUtc`, qui calcule le décalage réel du fuseau à cet instant (CET ou CEST) et le
**raffine une fois** pour gérer les bascules d'heure d'été/hiver. `startOfWeekParis` part du début
du jour parisien et retranche `(jour ISO − 1)` jours. Les tests
(`apps/api/src/common/time.test.ts`) vérifient les deux saisons.

</details>
