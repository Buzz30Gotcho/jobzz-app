# Questions d'apprentissage

Difficulté progressive. La réponse est cachée : déplie le bloc quand tu veux vérifier.

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
