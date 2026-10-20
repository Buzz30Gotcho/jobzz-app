# Projet Jobzz : cahier des charges complet

Ce document est la **référence unique** du projet. Lis-le en entier avant de commencer.

---

## 0. Mode de travail : autonomie totale

- **Tu travailles en autonomie complète, sans me poser de questions.** Toutes les décisions produit et techniques sont prises dans ce document.
- Si un détail n'est pas couvert, **choisis l'option la plus simple et la plus cohérente** avec ce document, applique-la, et note-la dans `docs/DECISIONS.md` (date, décision, raison, alternatives écartées). Ne t'arrête pas pour demander.
- Si une information externe est incertaine (nom exact d'un paramètre d'API, version d'une bibliothèque), utilise la documentation officielle si tu y as accès, sinon la meilleure hypothèse, **isole-la dans un seul fichier de configuration ou un seul connecteur**, et note-la dans `docs/DECISIONS.md` comme « à vérifier ».
- Tu ne t'arrêtes que pour un **blocage technique réel** que tu ne peux pas contourner (par exemple un outil impossible à installer). Dans ce cas, explique le problème et propose la solution.
- Au démarrage : écris ton plan dans `docs/PLAN.md` (architecture, structure des dossiers, modèle de données, étapes), puis **commence directement**, sans attendre de validation.
- Avance par étapes (section 14). Chaque étape aboutit à une version **qui fonctionne**, testée, avec un commit Git clair.

---

## 1. Contexte et vision

Je suis étudiant en Bac+5 (Expert en développement logiciel, Ynov Montpellier) et je cherche une alternance en développement full-stack. Jobzz répond à un problème que je vis : on envoie beaucoup de candidatures, on perd le fil, on ne relance pas, et les sites d'offres noient les candidats sous des offres peu pertinentes.

C'est un **vrai produit**, pour de vrais utilisateurs : moi, mes amis, puis d'autres étudiants et jeunes diplômés. Il doit être **fiable, sécurisé et agréable au quotidien**. Le code doit être propre, testé et maintenable : je vais le faire évoluer seul, longtemps.

**Public cible** : étudiants et jeunes diplômés qui cherchent une **alternance** ou un **stage**, puis leur **premier emploi** (CDD ou CDI junior). **Tous les secteurs et tous les métiers** (commerce, RH, santé, BTP, communication, informatique…) : rien ne doit être pensé uniquement pour les développeurs. Pas de ciblage des profils expérimentés, de l'intérim ou des reconversions.

**Proposition de valeur, en une phrase** : *Jobzz trouve les offres de stage, d'alternance et de premier emploi qui te correspondent vraiment, et te rappelle de relancer.*

**Positionnement** : la niche de Jobzz, ce sont **les débuts de carrière**, mal servis par les grands sites généralistes : offres juniors noyées parmi les postes expérimentés, critères propres à chaque type de recherche ignorés (rythme et date imposée par l'école pour l'alternance, durée et période pour un stage, expérience demandée pour un CDD ou un CDI). Le cœur du produit, c'est **la recherche précise et honnête** (recherche manuelle et automatisations) ; la relance, légère, boucle la boucle « trouver → postuler → relancer ».

### Principes produit (à respecter dans chaque décision)

1. **L'outil prépare, l'utilisateur valide.** Jobzz n'envoie jamais rien et ne postule jamais à la place de l'utilisateur.
2. **Pour les offres, Jobzz montre et l'utilisateur postule. Pour les relances, Jobzz prépare et l'utilisateur envoie.** Jobzz ne rédige pas de lettres ni de messages de candidature à une offre.
3. **Honnêteté** : jamais de fausses offres présentées comme vraies, jamais de promesse que Jobzz ne peut pas tenir. Quand une information est incertaine ou impossible à obtenir, on le dit.
4. **Qualité plutôt que quantité** : peu d'offres, mais pertinentes, triées et expliquées.
5. **Épuré** : pas d'avertissements inutiles, pas de surcharge. Une action principale claire par écran.
6. **Tout fonctionne sans IA.** L'IA améliore, elle n'est jamais indispensable.
7. **Simple à prendre en main** : un nouvel utilisateur ne doit jamais être perdu. **Une idée = un endroit** (tout ce qui concerne les candidatures est dans « Relances », tout ce qui concerne les offres est dans « Offres »). **Seulement 4 entrées dans le menu** (section 11). Les options avancées sont **cachées par défaut** et n'apparaissent que quand elles servent (divulgation progressive).

---

## 2. Offres Gratuit et Premium

### Le principe

- **Le gratuit apporte une vraie valeur** (recherche d'offres précise, relances, analyse du CV par règles), pour que les gens adoptent Jobzz et en parlent.
- **Le Premium regroupe ce qui coûte de l'argent** (IA, automatisations qui tournent en continu) et ce qui fait gagner le plus de temps.

### Contenu des offres (valeurs par défaut, toutes dans la configuration)

| Fonctionnalité | Gratuit | Premium |
|---|---|---|
| Candidatures suivies (« J'ai postulé ») et relances | illimité | illimité |
| Rappels de relance, envoi via sa messagerie | ✅ | ✅ |
| Messages de relance et d'envoi libre **à partir de modèles** | ✅ | ✅ |
| Messages de relance et d'envoi libre **rédigés par l'IA** | ❌ | ✅ (30 par jour) |
| Envoi libre (candidature spontanée, remerciement…) | 5 par semaine | illimité |
| Recherche d'offres manuelle, avec score et explication | les **25 meilleures offres par jour** | **toutes les offres** |
| Aide aux alertes sur les autres sites (Indeed, LinkedIn…) | ✅ | ✅ |
| **Automatisations** (offres envoyées par mail) | **1** « automatisation découverte » : **1 mail par semaine** (lundi 8 h), **5 offres maximum**, sans IA | **jusqu'à 5 actives**, mail **dès qu'il y a de nouvelles offres**, tri affiné par l'IA |
| Créer une automatisation en décrivant sa demande avec ses mots (assistant IA) | ❌ (1 clic, modèle ou formulaire) | ✅ |
| Analyse du CV par règles | 1 par mois | illimité |
| Analyse du CV par l'IA | ❌ | 3 par jour |
| **Comparer son CV à une offre** | ✅ par règles (compétences présentes et manquantes), **1 par jour** | ✅ par règles + **conseils IA** pour adapter le CV à l'offre (10 par jour) |
| Aide et tickets | ✅ | ✅ |

- Le **compte admin** a toujours tout, sans limites (voir section 4.11).
- **Limite des offres vues (gratuit)** : c'est la seule limite de la recherche, car c'est ce que Jobzz peut mesurer de façon fiable (il ne peut pas vérifier qu'une candidature a vraiment été envoyée, donc le suivi des candidatures n'est pas limité).
  - Le filtrage et le tri sont **identiques** pour tous : la liste contient toutes les offres qui correspondent au profil, de la meilleure à la moins bonne. En gratuit, seules les **25 premières** de la journée sont lisibles.
  - Chaque offre affichée compte **une seule fois par jour**, même si l'utilisateur change ses filtres ou revient plus tard (compteur `UsageCounter`, feature `offers_viewed`, et table `OfferView` pour ne compter chaque offre qu'une fois). Remise à zéro à minuit (heure de Paris).
  - Au-delà, un encadré honnête avec le **vrai nombre** : « Tu as vu tes 25 meilleures offres du jour. **13** autres te correspondent encore. Reviens demain, ou passe Premium pour toutes les voir. » Les offres suivantes sont affichées **floutées** (rang et score seulement, illisibles), jamais cachées en silence.
  - Compteur discret en haut de la liste : « Offres du jour : 18 / 25 ».
- Quand une limite est atteinte : un message court et sympathique qui dit quand la limite revient et ce que débloque le Premium. **Jamais de perte de données** : si un utilisateur repasse en gratuit, ses données au-delà des limites restent visibles ; sa première automatisation (la plus ancienne active) passe au rythme gratuit (1 mail par semaine), les autres passent en pause.

### Ce qui est codé maintenant (phase 1, en local)

- Un **module `entitlements`** centralisé dans le back-end : `can(user, feature)`, `limit(user, feature)`, `consume(user, feature)`, avec un compteur d'utilisation par période. **Toutes** les fonctionnalités de ce tableau passent par ce module, vérifié **côté serveur**.
- Un champ `plan` sur l'utilisateur (`free` / `premium`) et un champ `premiumUntil` (date de fin des droits Premium).
- Une variable `PLAN_ENFORCEMENT` :
  - `false` (**par défaut en local**) : tout le monde est traité comme Premium, sans aucune limite ; pages Tarifs et Mon abonnement masquées ;
  - `true` : les limites du gratuit s'appliquent, les pages Tarifs et Mon abonnement apparaissent. C'est le mode à utiliser pour **tester le paiement** en local.
- **Le paiement Stripe est codé dès maintenant, en mode test uniquement** (section 2.1). Aucun vrai argent en local.
- Les limites sont testées par des tests unitaires avec `PLAN_ENFORCEMENT=true` et `false`.

### 2.1 Paiement avec Stripe (codé en phase 1, en mode test)

**Principe** : Jobzz ne voit et ne stocke **jamais** de numéro de carte. Tout le paiement se fait sur les pages sécurisées de Stripe (Stripe Checkout et portail client Stripe).

**Parcours du client**
1. **Page « Tarifs »** (`/tarifs`, publique, et lien depuis l'appli quand une limite est atteinte) : les offres Gratuit, Premium mensuel, Pass 3 mois et, tant qu'elle est disponible, l'offre de lancement (« Plus que 37 places »). Tableau clair de ce que débloque le Premium.
2. Bouton **« Passer Premium »** → le back-end crée une session **Stripe Checkout** → le client paie sur la page Stripe (carte bancaire ; Apple Pay et Google Pay si activés dans Stripe).
3. Retour sur Jobzz : page « Bienvenue en Premium » ; le compte devient Premium **dès la réception du webhook** de confirmation (jamais sur la simple redirection, qui n'est pas une preuve de paiement). Pendant l'attente, un message « Paiement en cours de confirmation… ».
4. **« Mon abonnement »** (Profil → Paramètres) : offre actuelle, date de renouvellement ou de fin, bouton **« Gérer mon abonnement »** qui ouvre le **portail client Stripe** (changer de carte, télécharger les factures, résilier en un clic).

**Les offres côté Stripe**
- **Premium mensuel (9,99 €)** et **offre de lancement (6 €)** : abonnements mensuels (Checkout en mode `subscription`). À la résiliation, le Premium reste actif jusqu'à la fin de la période payée.
- **Pass 3 mois (24,99 €)** : paiement unique (Checkout en mode `payment`), qui donne `premiumUntil` = date du paiement + 3 mois, **sans renouvellement**. Un mail prévient 7 jours avant la fin. Un Pass acheté pendant un Premium déjà actif s'ajoute à la date de fin.
- **Offre de lancement** : limitée aux **100 premiers abonnés** (compteur en base, vérifié côté serveur au moment de créer la session de paiement) ; quand la limite est atteinte, elle disparaît de la page Tarifs. Un abonné de lancement qui résilie perd ce tarif.
- Les identifiants des prix Stripe sont dans la configuration (`.env`), jamais en dur dans le code.

**Webhooks (la source de vérité)**
- Route `POST /webhooks/stripe`, **signature vérifiée** avec le secret de webhook, **idempotente** (chaque événement Stripe enregistré une seule fois dans `StripeEvent` ; un événement déjà traité est ignoré).
- Événements traités : `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.
- Chaque changement met à jour `plan`, `premiumUntil` et les `SubscriptionPeriod` (pour les statistiques), puis applique les règles de passage gratuit ↔ Premium (section 2 : automatisations en pause, automatisation découverte).
- **Échec de paiement** : mail à l'utilisateur avec un lien vers le portail Stripe ; Stripe réessaie automatiquement ; si l'abonnement est finalement annulé, retour au gratuit.
- Une tâche quotidienne (pg-boss) repasse en gratuit les comptes dont `premiumUntil` est dépassé (Pass 3 mois terminés).

**Mode test en local**
- Clés Stripe de **test** uniquement (`sk_test_…`, `pk_test_…`). Au démarrage, si `NODE_ENV` n'est pas `production` et qu'une clé réelle (`sk_live_…`) est détectée, l'application **refuse de démarrer** avec un message clair.
- Réception des webhooks en local avec la **Stripe CLI** (`stripe listen --forward-to localhost:<port>/webhooks/stripe`), expliquée pas à pas dans le README.
- Paiement testé avec les **cartes de test Stripe** (par exemple `4242 4242 4242 4242`, et les cartes de test qui simulent un refus ou une authentification 3D Secure), listées dans le README.
- Si les clés Stripe ne sont pas renseignées : les boutons de paiement affichent « Paiement non configuré » et le reste de l'application fonctionne normalement.
- Le compte admin reste toujours Premium, sans paiement.

### Ce qui est fait à la mise en ligne (phase 2, à décrire dans `DEPLOIEMENT.txt`)

Passage de Stripe en mode réel (clés de production, produits et prix réels, webhook de production), compteur visible (« Offres du jour : 18 / 25 »), passage à `PLAN_ENFORCEMENT=true`.

**Prix prévus** (dans la configuration, modifiables) :

| Offre | Prix |
|---|---|
| Gratuit | 0 € |
| Premium mensuel | **9,99 € par mois**, sans engagement |
| Pass recherche 3 mois | **24,99 €**, payé en une fois, sans renouvellement automatique |
| Offre de lancement | **6 € par mois à vie** pour les **100 premiers abonnés** Premium mensuel (tant qu'ils restent abonnés) |

Pas d'abonnement annuel (une recherche dure rarement un an) et pas d'essai gratuit. Le Premium mensuel et le Pass 3 mois donnent exactement les mêmes fonctionnalités.

---

## 3. Parcours utilisateur de A à Z

1. **Découverte** : page d'accueil publique (ce que fait Jobzz, en 3 blocs, avec un bouton « Créer mon compte »).
2. **Inscription** : email + mot de passe → mail de confirmation (Mailpit en local). L'appli est utilisable avant confirmation, avec un bandeau discret. Aucun mail d'offres n'est envoyé tant que l'email n'est pas confirmé.
3. **Accueil guidé (3 écrans, chacun passable)** :
   1. « Qu'est-ce que tu cherches ? » : métier(s), type(s) de contrat, ville(s), date de début (les seuls champs **obligatoires** du profil) ;
   2. compétences en un clic (suggestions selon le métier) ;
   3. « Et si les offres venaient à toi ? » : **un seul bouton** « Activer mon automatisation » (créée en 1 clic depuis ce qu'il vient de remplir ; en gratuit, c'est l'automatisation découverte, 1 mail par semaine), ou plus tard. Lien secondaire : régler ses alertes sur les autres sites.
4. **Usage quotidien** : le tableau de bord dit quoi faire aujourd'hui (« 3 entreprises à buzzer », « 2 automatisations actives, dernier mail ce matin »).
5. **Relancer** : 7 jours après avoir cliqué « J'ai postulé » sur une offre de Jobzz, l'onglet « À buzzer » propose de relancer l'entreprise avec un message prêt → l'utilisateur ouvre sa messagerie, envoie, revient → Jobzz lui demande s'il a bien envoyé.
6. **Recevoir des offres** : ses automatisations lui envoient des mails avec les offres pertinentes → il les consulte sur le site d'origine et **gère lui-même la suite** (ces offres ne sont pas reliées aux relances). Ses alertes sur Indeed, LinkedIn… sont bien réglées grâce à l'aide aux alertes de Jobzz.
7. **Victoire** : il signale une réponse « Entretien » → petite célébration.
8. **Fin de recherche** : il clique sur **« J'ai trouvé ! »** (section 4.9) → félicitations, proposition de mettre ses automatisations en pause, une question rapide « Jobzz t'a aidé ? ». Il peut aussi supprimer son compte et ses données.

---

## 4. Fonctionnalités détaillées

### 4.1 Comptes et sécurité

- **Mots de passe** : argon2id. Minimum 10 caractères. Jamais stockés ni journalisés en clair.
- **Sessions** : jeton d'accès JWT court (15 minutes) gardé en mémoire côté front, et jeton de rafraîchissement opaque (30 jours) dans un **cookie httpOnly, Secure, SameSite=Lax**, stocké haché en base, **renouvelé à chaque utilisation** (rotation) et révocable. Déconnexion = révocation.
- **Vérification de l'email** : lien à usage unique, valable 48 h, renvoyable (maximum 3 fois par heure).
- **Mot de passe oublié** : lien à usage unique, valable 1 h. Même message que l'email existe ou non. Toutes les sessions sont révoquées après un changement de mot de passe.
- **Protection** : limitation de débit sur la connexion, l'inscription et les mails (par IP et par compte), en-têtes de sécurité (Helmet), CORS restreint au front, validation Zod de toutes les entrées, vérification des rôles côté serveur sur chaque route.
- **Bêta sur invitation** : si la variable `BETA_INVITE_CODE` est renseignée, l'inscription demande ce code (champ « Code d'invitation »). Vide (par défaut) : inscription libre. Rien d'autre ne change dans l'appli.
- **Rôles** : `user`, `admin` (et `support` prévu dans le code mais non utilisé : accès aux tickets uniquement).

### 4.2 Profil

- **Obligatoire** (accueil guidé) : métier(s) visé(s), type(s) de contrat, ville(s) + rayon, date de début possible.
- **Facultatif** : prénom, nom, téléphone, lien LinkedIn, liens libres (portfolio, GitHub, Behance…), compétences, secteurs, niveau et domaine d'études, préférence télétravail (indifférent, accepté, souhaité, exclu).
- **Métier** : autocomplétion sur le **référentiel ROME** via l'API France Travail quand les clés sont configurées ; sinon saisie libre (le libellé sert alors de mots-clés). Les codes ROME ne sont **jamais inventés** : ils viennent uniquement du référentiel.
- **Villes** : autocomplétion via **geo.api.gouv.fr** (gratuit, sans clé) pour obtenir le code INSEE, le département et les coordonnées. Cache local.
- **Type de contrat** : alternance, stage, CDD, CDI, plusieurs choix possibles. Champs qui s'adaptent :
  - alternance → rythme (texte normalisé, ex. « 3 sem. entreprise / 1 sem. école »), durée en mois, école ;
  - stage → durée en mois et période ;
  - CDD / CDI → niveau d'expérience (débutant, moins de 1 an, 1 à 3 ans, plus de 3 ans).
- **Plus de 3 ans d'expérience** : option possible mais hors cible. Si elle est choisie, une phrase s'affiche **une seule fois** : « Jobzz est pensé pour les débuts de carrière : tu trouveras surtout des offres juniors. » Le filtre junior (section 4.5) est alors désactivé pour cet utilisateur ; rien d'autre n'est bloqué.
- **Compétences** : étiquettes ; suggestions en un clic selon le métier (liste de compétences courantes par grand domaine, dans un fichier de données facile à compléter) ; bouton « Je connais » dans le détail d'une offre ; extraction depuis le CV.
- **Indicateur de complétude**, uniquement sur la page Profil : pourcentage, **pastilles neutres** (jamais rouges, jamais d'icône d'alerte) listant seulement ce qui **améliore les offres** (compétences, CV, lien LinkedIn, préférence télétravail…), chacune cliquable vers le champ concerné. On ne demande jamais d'informations inutiles à la recherche (pas de date de naissance, d'adresse ni de photo).
- **Signature** des messages générée depuis le profil (nom, téléphone, LinkedIn, un lien).
- **Mail des offres** : interrupteur « Recevoir le mail des offres : oui / non ». Sur « non », les automatisations restent actives mais aucun mail ne part ; un bandeau dans l'onglet « Mes automatisations » le rappelle.

### 4.3 Candidatures et relances (version légère, au service des offres)

Les relances concernent **uniquement les candidatures faites depuis Jobzz** : les offres de la recherche où l'utilisateur a cliqué « J'ai postulé », et ses candidatures spontanées. Les offres reçues par mail (automatisations) ou trouvées ailleurs sont gérées par l'utilisateur lui-même. Ce n'est **pas** un outil de suivi de candidatures : on garde le strict nécessaire.

**Page « Relances »**, deux onglets :
- **« À buzzer »** (par défaut) : les candidatures à relancer aujourd'hui, les plus en retard d'abord. Pour chacune : entreprise, poste, email, « il y a 9 jours », bouton **« Buzzer »**.
- **« Mes candidatures »** : une liste simple (recherche par entreprise, filtre par statut sous forme de **pilules** : Toutes, En attente, Relancées, Réponse reçue, Archivées ; une seule active à la fois). Sert à retrouver une candidature et à signaler une réponse.

En haut de la page, un bouton : **« Écrire à une entreprise »** (envoi libre). État vide de « À buzzer » : « Clique sur « J'ai postulé » sur une offre de Jobzz, on te rappellera de relancer dans 7 jours », avec un lien vers l'onglet Rechercher.

**Une candidature est créée de 2 façons seulement**
1. **« J'ai postulé »** sur une offre de la recherche (onglet « Rechercher ») : un clic, entreprise, poste et lien de l'offre enregistrés automatiquement. Si l'offre ne fournit pas d'email de contact, un champ facultatif « Email du recruteur » est proposé juste après le clic (on peut le passer) ;
2. **« Écrire à une entreprise »** (candidature spontanée).

**Rappel « Tu as postulé ? »** : quand l'utilisateur clique sur « Voir l'offre » puis **revient sur l'onglet Jobzz**, une petite fenêtre discrète demande « Tu as postulé chez {entreprise} ? » → **« Oui »** (note la candidature, comme « J'ai postulé ») / **« Pas encore »** (rien ne change) / **« Pas intéressé »** (masque l'offre). Fermer la fenêtre ne fait rien. Une seule question par offre (jamais reposée pour la même offre). 

**Doublons** : clé = entreprise normalisée + poste normalisé (minuscules, sans accents ni ponctuation, sans « SAS », « SARL »…). Si une candidature identique existe, on le signale et on propose de l'ouvrir plutôt que d'en créer une nouvelle.

**Statuts (3 seulement)** : `en_attente`, `relancee`, `reponse_recue` (avec le type de réponse : entretien, refus, autre). L'utilisateur peut aussi **archiver** une candidature (elle sort de « À buzzer »).

**Règle de relance (valeur par défaut dans la configuration)**
- Une candidature `en_attente` apparaît dans « À buzzer » **7 jours** après la date de candidature. Une échéance qui tombe un samedi ou un dimanche est décalée au lundi.
- Après une relance, la candidature passe en `relancee` et sort de « À buzzer ». Elle reste visible dans « Mes candidatures », avec un bouton **« Relancer encore »** disponible à la demande (pas de 2e relance automatique).
- Champ `nextFollowUpAt` calculé et indexé.

**Message de relance**
- **Modèle** (gratuit) : court, poli, professionnel, adapté à tous les métiers, avec variables `{entreprise}`, `{poste}`, `{date_candidature}`, `{prenom}`, `{signature}` et, pour l'alternance, le rythme et la date de disponibilité. Un second modèle, plus court, pour « Relancer encore ». Modèles dans un fichier de données facile à modifier.
- **IA** (Premium) : version personnalisée, avec le petit indicateur IA.
- Toujours **modifiable** avant envoi.

**Envoi (aucun mail ne part du serveur)**
- Formulaire : destinataire, objet, message, aperçu.
- Boutons : **« Envoyer avec Gmail »** (`https://mail.google.com/mail/?view=cm&fs=1&to=…&su=…&body=…`), **« Envoyer avec Outlook »** (`https://outlook.office.com/mail/deeplink/compose?to=…&subject=…&body=…`), **« Ouvrir ma messagerie »** (`mailto:`), **« Copier »**. Encodage correct (accents, retours à la ligne). Si l'URL dépasse 1 800 caractères : le message est copié automatiquement et l'utilisateur est invité à le coller.
- **Confirmation** : au retour sur l'onglet Jobzz après un clic sur un bouton d'envoi, une petite fenêtre demande « C'est envoyé ? » → « Oui » (enregistre la relance) / « Pas encore ». Bouton « Marquer comme relancé » toujours disponible aussi.
- Chaque relance est enregistrée (date, canal, objet, message).

**Sans email : l'autre canal**
Si la candidature n'a pas d'email, le bouton « Buzzer » propose un message LinkedIn court (moins de 300 caractères) avec « Copier ». L'utilisateur cherche lui-même la personne. Jobzz ne cherche jamais d'emails ou de profils sur le web.

**« L'entreprise a répondu »** : Entretien / Refus / Autre réponse. La candidature passe en `reponse_recue` et sort des relances. « Entretien » déclenche la célébration ; « Refus » affiche un message encourageant.

**Envoi libre (« Écrire à une entreprise »)**
Deux types : **candidature spontanée** (crée la candidature) et **remerciement après entretien** (rattaché à la candidature existante si elle existe). L'utilisateur saisit l'entreprise, l'email et éventuellement le poste ; Jobzz propose le message (modèle, ou IA en Premium) ; même formulaire d'envoi.

### 4.4 Sources d'offres

**Sources officielles uniquement. Jamais de scraping** (Indeed, LinkedIn, Welcome to the Jungle… n'ont pas d'API publique de recherche et l'interdisent).

1. **France Travail – API « Offres d'emploi v2 »** (tous contrats)
   - Accès : compte sur francetravail.io, application, OAuth2 *client credentials* (scope `api_offresdemploiv2`), jeton mis en cache et renouvelé avant expiration.
   - Paramètres de recherche utiles (noms indicatifs, **à vérifier dans la documentation officielle**, isolés dans le connecteur) : `motsCles`, `codeROME`, `commune`, `distance`, `departement`, `typeContrat`, `natureContrat` (apprentissage, professionnalisation), `experienceExige` (débutant accepté / souhaitée / exigée), `minCreationDate` / `maxCreationDate` ou `publieeDepuis`, `range`, `sort`.
   - Champs utiles : intitulé, description, lieu (libellé, code postal, coordonnées), entreprise (nom, parfois absent), type et nature de contrat, expérience exigée, compétences, salaire (texte libre), durée du travail, alternance (oui/non), dates de création et de mise à jour, URL d'origine.
   - Limites : environ 10 appels par seconde, 1 150 résultats maximum par requête : découper par département ou par période si besoin.
   - Conditions : citer France Travail comme source, afficher la date de mise à jour, lien vers l'offre d'origine, contenu complet de l'offre dans le détail.
2. **La bonne alternance** (alternance uniquement)
   - Accès : compte sur api.apprentissage.beta.gouv.fr, clé d'API.
   - Recherche par codes ROME ou RNCP, position (latitude, longitude), rayon et niveau de diplôme.
   - Champs utiles : titre, description, type (apprentissage / professionnalisation), **date de début et indicateur de début flexible**, **durée**, **télétravail** (sur site / hybride / à distance), compétences souhaitées, niveau de diplôme visé, entreprise (SIRET, nom, taille, NAF), adresse et coordonnées, URL ou moyen de candidature, dates de création et d'expiration.
   - Elle renvoie aussi des **« recruteurs »** (entreprises à fort potentiel d'embauche en alternance, sans offre publiée) : **non utilisés en v1**, prévus pour la version 2 (section 4.14).
   - Conditions : clé secrète, **interdiction de revendre les données**.
3. **Adzuna** (désactivé par défaut) : connecteur prévu mais désactivé ; quotas faibles et licence commerciale nécessaire.

**Réalité à assumer dans l'interface** : les **stages** sont peu présents dans ces sources (France Travail publie surtout des contrats de travail, La bonne alternance uniquement de l'alternance). Quand un utilisateur cherche un stage, Jobzz le dit honnêtement une fois (« Peu d'offres de stage sont disponibles via nos sources officielles : pense aussi aux candidatures spontanées »), sans répéter le message partout.

**Enrichissement entreprise** : **API Recherche d'entreprises** (recherche-entreprises.api.gouv.fr, gratuite, sans clé) : tranche d'effectif, catégorie (PME, ETI, GE), code NAF, date de création, labels (ESS, association). Recherche par SIRET si disponible, sinon par nom + commune (correspondance acceptée seulement si elle est fiable). Cache 30 jours par entreprise. Limiter le débit (quelques appels par seconde).

**Architecture**
- Interface commune `JobSource` : `search(query): Promise<SourceResult>`, chaque connecteur **normalise** vers un format unique `NormalizedOffer` (voir section 6).
- Connecteurs : `demo`, `franceTravail`, `laBonneAlternance`, `adzuna` (désactivé). Activation par configuration.
- **Dédoublonnage** entre sources : même entreprise normalisée + titre normalisé + commune, ou même SIRET + titre proche.
- **Mode démo** : `JOB_SOURCES_MODE=demo` active **uniquement** le connecteur fictif (40 offres variées, entreprises au nom clairement inventé). Bandeau permanent « Mode démo : offres fictives » et badge « Fictive » sur chaque offre et dans les mails. **Jamais utilisé comme secours** en mode normal.
- **Pannes** : jamais d'offres inventées. Message honnête (« France Travail ne répond pas pour le moment, on réessaie automatiquement »), affichage des autres sources, nouvelles tentatives espacées (backoff exponentiel), erreur journalisée et visible dans l'admin. Clé manquante en mode normal : « La recherche d'offres n'est pas encore configurée ».

**Extraction d'attributs (enrichissement d'offre)**
Pour chaque nouvelle offre, un enrichissement est calculé une fois et mis en cache (`OfferEnrichment`, versionné) :
- **par règles** d'abord : compétences (dictionnaire + familles), télétravail (mots-clés « télétravail », « remote », « hybride »…), durée, date de début, rythme d'alternance (motifs « 3 semaines / 1 semaine », « 2 jours / 3 jours »…), salaire (extraction depuis le texte), indices d'ESN (« ESN », « SSII », « client final », « régie », « intercontrat ») ;
- **par l'IA** ensuite, en tâche de fond, seulement pour les offres qui ont passé les filtres obligatoires d'au moins une automatisation : mêmes attributs, sortie JSON validée, avec un niveau de confiance par attribut.
- Les données structurées de la source sont toujours prioritaires sur l'extraction.

### 4.5 Recherche d'offres manuelle

Page **« Offres »**, onglet **« Rechercher »** (onglet par défaut ; l'autre onglet est « Mes automatisations ») : recherche immédiate basée sur le profil (modifiable par des filtres en haut de page : métier, lieu, rayon, contrat). Résultats en 1 à 2 secondes, sans IA.

- **Filtres obligatoires** (offre jamais affichée sinon) : métier (code ROME identique ou proche, ou mots-clés du métier), type de contrat, zone (commune + rayon, ou département, ou télétravail complet si accepté), publication de moins de 30 jours, date de début compatible si elle est connue (de 15 jours avant à 90 jours après la disponibilité, ou début flexible), **filtre junior** (ci-dessous).
- **Filtre junior** (actif partout : recherche manuelle, automatisations, mails ; mots et seuils dans la configuration, fonction pure testée) :
  - il s'adapte au niveau d'expérience du profil (ou de l'automatisation) : **débutant ou moins de 1 an** → on écarte les offres qui exigent plus de 2 ans ; **1 à 3 ans** → on accepte jusqu'à 3 ans d'expérience exigée et les offres « confirmé » sans durée précise ; **plus de 3 ans** → filtre désactivé ;
  - **titre** contenant « senior », « lead », « head of », « directeur », « directrice » (et « confirmé », « expérimenté » pour les niveaux débutant et moins de 1 an) → offre écartée ;
  - **texte** demandant clairement une expérience supérieure au seuil (motifs « 5 ans d'expérience minimum », « expérience de 3 ans exigée »…) ou champ structuré « expérience exigée » au-delà du seuil → offre écartée ;
  - **jamais écartée** si le titre contient « alternance », « apprenti », « stage », « stagiaire », « junior », « débutant » ou « jeune diplômé » ;
  - « manager » et « responsable » ne sont **pas** des mots d'exclusion (community manager, office manager, responsable commercial en alternance… sont des postes juniors courants) ;
  - transparent : dans l'entonnoir d'une automatisation, une ligne « 12 offres trop expérimentées écartées ».
- **Compétences** : au moins une compétence spécifique en commun (identique ou de la même famille). Exceptions : si le profil a moins de 3 compétences, ou si l'offre ne liste aucune compétence, l'offre passe sur les autres critères.
- **Score** (voir 4.7), libellé et explication courte : « 72 % · Bon match · tu as React et SQL, il te manque Docker ».
- Tri par score. Affichage des offres à partir de 40 %. Pagination.
- Le rythme d'alternance, la distance exacte et la date sont affichés comme informations neutres. **Pas d'avertissements sur les cartes.**
- Chaque carte : titre, entreprise, ville + distance, contrat, date de publication, source, score + libellé + explication. Boutons **« Voir l'offre »** (lien d'origine, nouvel onglet), **« J'ai postulé »**, **« Masquer »** (l'offre ne revient plus).
- Un clic sur la carte ouvre le **détail de l'offre** (panneau latéral sur ordinateur, page sur mobile) : description complète, source et date de mise à jour, compétences demandées (avec « Je connais »), et le bouton **« Comparer avec mon CV »** (section 4.8).
- Les offres auxquelles l'utilisateur a déjà postulé, ou masquées, ne sont plus affichées. Une offre d'une entreprise déjà contactée pour un **autre** poste reste affichée.

### 4.6 Automatisations (fonctionnalité Premium phare)

Une **automatisation** est une recherche sauvegardée qui tourne toute seule et envoie par mail les nouvelles offres correspondantes. C'est la fonctionnalité la plus importante du Premium : elle doit être **précise, transparente et fiable**.

#### Principes

- Un utilisateur peut avoir **plusieurs automatisations** (1 en gratuit, 5 actives maximum en Premium, illimité pour l'admin et en local), **indépendantes les unes des autres et de son profil**. Exemples pour une même personne : « Alternance dev back-end Java à Montpellier » et « CDI junior data analyst à Paris ou en télétravail ».
- Chaque automatisation a ses propres critères. Le profil sert seulement à **pré-remplir** (bouton « Partir de mon profil ») et de compétences par défaut si l'automatisation n'en précise pas.
- **L'utilisateur décrit ce qu'il veut avec ses propres mots**, aussi précisément qu'il le souhaite. L'IA traduit sa demande en critères structurés et **lui répond honnêtement ce qu'elle peut faire, ce qu'elle peut faire seulement approximativement, et ce qu'elle ne peut pas faire**, avec les sources disponibles.
- **Les critères obligatoires sont toujours appliqués par le code, de façon déterministe.** L'IA comprend la demande, extrait des attributs des offres et affine le classement, mais **elle ne décide jamais seule d'inclure une offre qui viole un critère obligatoire**.

#### Les critères possibles (schéma `AutomationCriteria`, versionné, défini en Zod dans `packages/shared`)

Chaque critère a un **mode** : `obligatoire` (filtre), `preference` (influence le score) ou `exclusion` (filtre négatif) ; et une règle **« si l'information est absente de l'offre »** : `garder` (par défaut) ou `exclure`.

- **Métiers** : un ou plusieurs (libellé + codes ROME résolus par le référentiel).
- **Mots-clés** : à inclure (au moins un), indispensables (tous), à exclure (aucun).
- **Contrats** : alternance (apprentissage, professionnalisation ou les deux), stage, CDD, CDI. Pour l'alternance : rythme souhaité, durée. Pour le stage : durée minimale et maximale.
- **Lieux** : une ou plusieurs zones (commune + rayon, département, région, toute la France) ; **télétravail** : indifférent, accepté, exigé (100 %), hybride minimum, exclu.
- **Date de début** : fenêtre (du / au), flexibilité.
- **Expérience** : maximum accepté (débutant, moins de 1 an, 1 à 3 ans), qui règle le filtre junior ; par défaut, celui du profil.
- **Compétences** : propres à l'automatisation ou celles du profil ; chaque compétence peut être `indispensable` ou `souhaitee`.
- **Entreprise** : tailles (TPE, PME, ETI, grand groupe), types (startup, association / ESS, secteur public), secteurs à inclure ou exclure (codes NAF ou mots), entreprises précises à exclure (par nom), exclure les ESN.
- **Salaire minimum** (annuel brut ou mensuel).
- **Fraîcheur** : offres publiées depuis moins de N jours (14 par défaut).
- **Score minimum** pour qu'une offre soit envoyée (60 par défaut).

#### Matrice de faisabilité (ce que l'IA doit annoncer honnêtement)

Cette matrice est codée dans un fichier de données (`automation-capabilities.ts`) et sert à la fois au code (comment appliquer chaque critère) et à l'IA (ce qu'elle peut promettre).

| Critère | Comment il est appliqué | Fiabilité |
|---|---|---|
| Métier | Paramètre de la source (ROME / mots-clés) | **Fiable** |
| Lieu et rayon | Paramètre de la source + calcul de distance | **Fiable** |
| Type de contrat | Paramètre de la source (type et nature de contrat ; La bonne alternance = alternance) | **Fiable** |
| Fraîcheur de publication | Paramètre de la source + date de création | **Fiable** |
| Expérience exigée | Champ structuré France Travail ; texte sinon | **Fiable** si renseigné |
| Mots-clés inclus / exclus | Recherche dans le titre et la description | **Fiable** |
| Entreprise précise exclue | Nom normalisé (attention : certaines offres France Travail n'indiquent pas l'entreprise) | **Fiable** si le nom est présent |
| Compétences | Champs structurés + dictionnaire + familles + IA | **Bonne** |
| Télétravail | Champ structuré La bonne alternance ; texte de l'offre (règles + IA) pour France Travail | **Approximatif** |
| Date de début, durée | Champs structurés La bonne alternance ; texte pour France Travail | **Approximatif** |
| Rythme d'alternance | Texte uniquement (règles + IA) ; jamais éliminatoire | **Approximatif** |
| Taille, catégorie d'entreprise | Taille La bonne alternance, tranche d'effectif, API Recherche d'entreprises | **Approximatif** |
| ESN | Code NAF de conseil en systèmes et logiciels informatiques + mots-clés + IA | **Approximatif** |
| Startup | Pas de définition officielle : entreprise de moins de 8 ans, moins de 250 salariés, secteur innovant (NAF + mots-clés) | **Approximatif**, expliqué à l'utilisateur |
| Secteur (fintech, santé, jeux vidéo…) | NAF + mots-clés + IA | **Approximatif** |
| Salaire minimum | Texte libre France Travail (rarement renseigné), absent chez La bonne alternance | **Peu fiable** : par défaut, on garde les offres sans salaire |
| Ambiance, valeurs, management, avantages précis | Impossible à vérifier de façon fiable | **Impossible** |
| Garantie d'embauche après l'alternance | Impossible | **Impossible** |
| Offres d'Indeed, LinkedIn, Welcome to the Jungle… | Pas d'API publique. À la place, Jobzz propose l'**aide aux alertes** sur ces sites (section suivante) | **Impossible** |
| Trouver le contact ou l'email du recruteur | Hors périmètre (vie privée) | **Impossible** |

**Règle d'application des critères approximatifs en mode `obligatoire`** : l'offre est exclue seulement si l'attribut détecté contredit le critère avec une confiance d'au moins 0,7 ; si l'attribut est inconnu, on applique la règle « si l'information est absente ». Pour les critères en mode `preference`, l'attribut joue sur le score proportionnellement à sa confiance.

#### Et sur les autres sites : l'aide aux alertes (gratuit, sans IA)

Jobzz ne peut pas récupérer les offres d'Indeed, LinkedIn, Welcome to the Jungle… (pas d'API publique, scraping interdit). À la place, il **aide l'utilisateur à régler des alertes précises directement sur ces sites** : Jobzz ne lit rien chez eux, il prépare seulement un texte de recherche et un lien. C'est l'utilisateur qui crée l'alerte sur le site.

- **Où** : dans l'onglet « Mes automatisations », une section **« Et sur les autres sites »**, visible par **tous** les utilisateurs (gratuit ou Premium). Elle est générée à partir de chaque automatisation, ou à partir du profil si l'utilisateur n'a pas d'automatisation.
- **Sites** : Indeed, LinkedIn, Welcome to the Jungle, HelloWork, APEC (jeunes diplômés). Liste dans un fichier de configuration.
- **Pour chaque site** : le texte de recherche conseillé, les filtres à cocher sur le site (lieu, rayon, type de contrat, niveau d'expérience), un bouton **« Copier »**, un bouton **« Ouvrir la recherche »** (lien pré-rempli quand le site le permet) et une phrase d'aide (« Clique ensuite sur « Créer une alerte » en haut des résultats »).
- **Génération par règles** (pas d'IA, testée unitairement) :
  - variantes du métier (synonymes et appellations, depuis le référentiel ROME ou un fichier de synonymes) ;
  - mot du contrat (« alternance » / « apprentissage », « stage », « CDI », « CDD ») ;
  - exclusions pour les juniors (« senior », « confirmé », « expérimenté », « lead », « head of », « directeur » ; jamais « manager » ni « responsable », courants dans les postes juniors) et les mots exclus de l'automatisation ;
  - **syntaxe adaptée à chaque site** : guillemets, `OR`, `AND`, `NOT` ou `-` selon ce que le site comprend ; simple liste de mots-clés si le site ne gère pas les opérateurs.
- **Robustesse** : les modèles de liens et la syntaxe de chaque site sont **isolés dans un seul fichier** (`alert-helpers.ts`), notés « à vérifier » dans `docs/DECISIONS.md`. Le texte à copier est **toujours affiché**, pour fonctionner même si un lien ne marche plus.
- Exemple (alternance développement back-end, Montpellier) — Indeed : `alternance ("développeur back-end" OR "développeur backend" OR "développeur java") -senior`, Montpellier, 30 km.

#### L'automatisation découverte (comptes gratuits)

- Un compte gratuit peut avoir **une seule automatisation**, **sans limite de durée**.
- Création : en 1 clic depuis le profil, avec un modèle, ou en modifiant les critères dans le formulaire. **Pas d'assistant IA** (« Décrire ce que je cherche » est réservé au Premium, avec un petit badge Premium et une phrase d'explication).
- Elle passe par **exactement le même moteur** que les automatisations Premium (même filtrage, même score), **sans l'ajustement IA**.
- Les offres retenues s'accumulent pendant la semaine ; **un seul mail par semaine, le lundi à 8 h** (heure de Paris), avec les **5 meilleures offres** de la semaine (pas de mail si aucune offre).
- **Des offres fraîches** : pour choisir les 5 offres, priorité aux offres publiées dans les **4 derniers jours** (configurable) parmi celles au-dessus du score minimum, triées par score ; on complète avec les plus anciennes seulement s'il en manque. Le mail gratuit doit donner envie, jamais décevoir avec des offres probablement déjà pourvues.
- **Ce qu'il rate, honnêtement**, en haut du mail, avec les vrais chiffres : « Cette semaine, **14 offres** correspondaient à ta recherche. Tu en vois **5**. Avec Premium, tu les reçois **toutes, le jour même**. » La phrase n'apparaît que si le nombre total dépasse 5 ; le chiffre est le vrai nombre d'offres retenues (jamais arrondi ni gonflé). Lien vers la page Tarifs (affiché quand `PLAN_ENFORCEMENT=true`).
- Dans l'onglet « Mes automatisations », l'automatisation découverte affiche clairement son rythme (« 1 mail par semaine, le lundi »). Le bouton « Nouvelle automatisation » reste visible pour un compte gratuit qui en a déjà une, et explique en une phrase que le Premium permet d'en avoir jusqu'à 5.
- Rythme et nombre d'offres dans la configuration. En local (`PLAN_ENFORCEMENT=false`), tout le monde a le fonctionnement Premium.

#### Création d'une automatisation : simple d'abord, précis si on le veut

**Règle d'or : créer une automatisation doit prendre quelques secondes.** Toute la mécanique (critères, fiabilité, entonnoir) existe mais reste **cachée tant que l'utilisateur ne la demande pas**. Pas de jargon : on parle d'« offres qui te correspondent », pas de « critères obligatoires » ou de « mode préférence ».

Trois façons de créer une automatisation, présentées dans cet ordre :

- **En 1 clic, depuis le profil** (action principale, gros bouton) : « Créer mon automatisation à partir de mon profil ». Un seul écran : un **résumé en une ligne** (« Alternance · Développeur web · Montpellier 30 km · dès janvier 2027 »), la **prévision** (« Prévision : environ 3 nouvelles offres par semaine », d'après les 2 dernières semaines), **3 exemples** d'offres récentes, et le bouton **« Activer »**. Un lien discret « Modifier » ouvre le détail.
- **Avec un modèle** : 3 à 5 modèles prêts, pré-remplis depuis le profil, en un clic : « Alternance dans mon domaine, près de chez moi », « Stage cet été », « Premier CDI, télétravail possible », « Tout mon département ». Même écran de confirmation que ci-dessus.
- **En décrivant ce que je cherche** (pour être plus précis) : le parcours ci-dessous.

**Le parcours « Décrire ce que je cherche » tient en 2 écrans :**
- **Écran 1** : le champ de texte et le bouton « Analyser ».
- **Écran 2** : le **même écran de confirmation simple** (résumé, estimation, 3 exemples, « Activer »), avec en plus :
  - les éventuelles **questions de précision** (3 maximum), sous forme de boutons de réponse rapide ;
  - une ligne discrète pour ce qui est **impossible** ou **approximatif** (« Je ne peux pas vérifier l'ambiance ; le télétravail sera détecté au mieux »), dépliable pour le détail ;
  - un bouton **« Modifier les critères »** qui déplie le formulaire détaillé, l'entonnoir et les badges de fiabilité.

Les étapes détaillées ci-dessous décrivent ce qui se passe **en coulisses** et dans la vue détaillée (dépliée).

**Détail du parcours (en coulisses et vue détaillée)**

1. **La demande** : un grand champ de texte, avec un exemple en placeholder :
   *« Alternance en développement back-end Java ou Kotlin, rythme 3 semaines / 1 semaine, à Montpellier ou en télétravail, début janvier 2027. Plutôt startup ou PME dans la santé ou la fintech, pas d'ESN. Débutant accepté. »*
   Case « Partir de mon profil » pour pré-remplir. Un lien « Remplir le formulaire à la place » pour ceux qui préfèrent.
2. **L'analyse par l'IA** (appel unique, sortie JSON contrainte par le schéma) renvoie :
   - les **critères structurés** (`AutomationCriteria`) ;
   - **« Voici ce que j'ai compris »** : une ligne par critère, avec la valeur, le badge de fiabilité (**Fiable**, **Approximatif**, **Impossible**) et une explication courte (« Le télétravail est indiqué clairement pour les offres d'alternance, mais seulement dans le texte des autres offres : je le détecterai au mieux ») ;
   - pour chaque élément **impossible** : pourquoi, et l'alternative possible (« Je ne peux pas vérifier l'ambiance. Je peux en revanche privilégier les entreprises de moins de 50 salariés ») ;
   - **au maximum 3 questions de précision** si la demande est ambiguë (« "Début janvier" : tu acceptes aussi un début en février ? »), affichées sous forme de choix rapides ;
   - un **nom** proposé pour l'automatisation (modifiable).
3. **Résolution par le code** (jamais confiée à l'IA) : métiers → codes ROME via le référentiel ; villes → codes INSEE et coordonnées via geo.api.gouv.fr ; vérification de la cohérence (dates, rayons, au moins un métier ou un mot-clé indispensable, au moins un lieu ou le télétravail). Ce qui ne se résout pas est signalé à l'utilisateur.
4. **Écran de vérification** : les critères affichés sous forme de formulaire **pré-rempli et modifiable**, regroupés par thème, avec les badges de fiabilité. **Seuls les critères que l'utilisateur a mentionnés (ou pré-remplis depuis son profil) sont affichés** ; tous les autres sont rangés dans une section **« Plus de critères »**, fermée par défaut. Ne jamais afficher la liste complète des critères d'un coup. L'utilisateur peut répondre aux questions de précision, modifier un champ, ou réécrire sa demande (nouvel appel IA, 3 allers-retours maximum ; au-delà, le formulaire seul).
5. **Prévision** : le code exécute l'automatisation à blanc sur les offres publiées ces **14 derniers jours** (requête aux sources avec la date de publication, plus les offres déjà en base) et affiche **uniquement** : « **Prévision** : environ 3 nouvelles offres par semaine », avec la phrase « D'après les offres publiées ces 2 dernières semaines. Le nombre réel peut varier selon le marché. » (le mot « prévision » est toujours écrit : c'est une estimation, jamais une promesse). Calcul : nombre d'offres retenues sur 14 jours ÷ 2, arrondi. L'**entonnoir détaillé** (offres trouvées → après métier et lieu → après contrat, date et filtre junior → au-dessus du score minimum) n'est **pas affiché par défaut** : il apparaît seulement si la prévision est à 0 (« Aucune offre ces 2 dernières semaines avec ces critères »), avec des suggestions concrètes en un clic calculées par le code (agrandir le rayon, accepter un début plus tard, baisser le score minimum, passer un critère approximatif de `obligatoire` à `preference`…), et dans « Pourquoi je n'ai rien reçu ? ». Les 3 à 5 meilleures offres de la période servent d'exemples.
6. **Activation** : l'automatisation passe en `active`.

**Sans IA** (Ollama indisponible) : le formulaire est proposé directement, avec seulement l'essentiel visible (métier, contrat, lieu, date de début) et le reste dans « Plus de critères », avec la même matrice de fiabilité affichée à côté de chaque critère. L'automatisation fonctionne ensuite normalement (scores sans ajustement IA).

#### Gérer ses automatisations

Page **« Offres »**, onglet **« Mes automatisations »** : liste avec nom, résumé en une ligne des critères, statut (`active`, `en_pause`, `erreur`), date du dernier mail, et **« Ces 4 dernières semaines : 11 offres »** (vrai nombre d'offres envoyées sur 28 jours glissants, qui remplace la prévision une fois l'automatisation active). Les offres elles-mêmes ne sont jamais listées sur le site : seulement ces chiffres, pour montrer que l'automatisation tourne. Actions : modifier (même assistant), mettre en pause / reprendre, dupliquer, supprimer.

Détail d'une automatisation :
- ses critères ;
- l'historique des 10 dernières exécutions (date, offres trouvées, offres retenues, statut) ;
- **« Pourquoi je n'ai rien reçu ? »** : l'entonnoir de la dernière exécution, critère par critère, et la date du prochain passage.

Les offres envoyées ne sont **pas listées sur le site** : elles arrivent uniquement par mail (décision produit).

#### Exécution (pg-boss)

- **Toutes les heures** (configurable), une tâche `automations.tick` :
  1. sélectionne les automatisations actives dont l'utilisateur a le droit (`entitlements`), un email confirmé et un compte actif ;
  2. construit les **requêtes source** et les **mutualise** entre automatisations (clé : source + codes ROME + zone + contrat) ;
  3. interroge les sources en mode **incrémental** (offres publiées depuis la dernière exécution réussie, moins une marge d'une heure), avec file d'attente et respect des quotas ;
  4. enregistre ou met à jour les offres (unicité source + identifiant externe, empreinte du contenu) ;
  5. lance l'enrichissement (règles immédiatement, IA en tâche de fond pour les offres candidates) ;
  6. pour chaque automatisation : filtres obligatoires → score déterministe → **ajustement IA** sur les 30 meilleures (−15 à +15 points, avec une raison courte) → on garde les offres au-dessus du score minimum, jamais déjà envoyées à cet utilisateur (une offre trouvée par deux automatisations n'est envoyée qu'une fois) ;
  7. enregistre l'exécution (`AutomationRun`) et ses compteurs d'entonnoir.
- **Échecs** : une source en panne donne une exécution partielle (les autres sources continuent). Après 3 échecs complets consécutifs, l'automatisation passe en `erreur` (visible pour l'utilisateur, avec un message honnête) et l'admin est alerté. Retour automatique à `active` à la première exécution réussie.

#### Le mail des offres

- **Un seul mail regroupe toutes les automatisations** de l'utilisateur, avec une section par automatisation (titre = nom de l'automatisation).
- **Premium** : envoi dès qu'il y a de nouvelles offres retenues, avec **au moins 4 heures entre deux mails** et **aucun envoi entre 22 h et 7 h** (heure de Paris) : les offres sont alors regroupées dans le mail suivant.
- **Gratuit (automatisation découverte)** : un mail par semaine, le lundi à 8 h, avec les 5 meilleures offres de la semaine.
- Au maximum **5 offres par automatisation et 15 par mail**, les meilleures d'abord ; les autres, moins pertinentes, ne sont pas envoyées.
- Pour chaque offre, **uniquement** : titre, entreprise, ville, type de contrat, source (« via France Travail ») et date, et un lien **« Voir l'offre »** vers l'offre d'origine. **Pas de score, pas de bouton de candidature, pas de texte préparé** (décision produit).
- Pied de mail : lien « Gérer mes automatisations », **lien de désinscription en un clic** (jeton signé ; il coupe le mail des offres, le compte reste intact ; en-tête `List-Unsubscribe`).
- Pas de mail vide. Mail HTML soigné aux couleurs de Jobzz, avec une version texte, compatible avec Gmail, Outlook et Apple Mail.

### 4.7 Score de compatibilité (déterministe, commun à la recherche manuelle et aux automatisations)

Calculé uniquement pour les offres qui ont passé les filtres obligatoires. Implémenté comme **fonction pure**, entièrement testée, avec des poids dans la configuration.

`score = 100 × Σ(poids × sous-score) / Σ(poids des critères applicables)`, arrondi, puis bonus et ajustement IA, borné entre 0 et 100.

| Critère | Poids | Sous-score |
|---|---|---|
| Compétences | 50 | Σ(correspondances) / nombre de compétences demandées par l'offre, plafonné à 1. Identique = 1 ; même famille = 0,5 ; compétence générique (Pack Office, anglais, travail en équipe…) = 0,25. Une compétence « indispensable » de l'automatisation absente plafonne ce sous-score à 0,5. Offre sans compétences listées = 0,6 et explication « compétences non précisées ». |
| Métier | 20 | Même code ROME = 1 ; même domaine professionnel (mêmes 3 premiers caractères du code ROME) = 0,6 ; correspondance par mots-clés seulement = 0,4. |
| Lieu | 10 | Distance ≤ moitié du rayon = 1, puis décroissance linéaire jusqu'à 0,5 au rayon maximum ; télétravail complet accepté = 1. |
| Date de début | 10 | À 15 jours près = 1 ; dans la fenêtre acceptée = de 1 à 0,4 selon l'écart ; inconnue = 0,7 ; flexible = 0,9. |
| Rythme / durée / expérience | 10 | Alternance : rythme identique = 1, différent = 0,5, inconnu = 0,8. Stage : durée dans la fourchette = 1, sinon 0,4. CDD/CDI : débutant accepté = 1, moins de 2 ans = 0,7, inconnu = 0,7. |

- **Bonus de préférences** (automatisations) : jusqu'à +10 points au total (mots-clés à inclure présents, type ou taille d'entreprise préférés, télétravail préféré), pondérés par la confiance de l'attribut.
- **Ajustement IA** (automatisations uniquement) : −15 à +15 points, uniquement sur les 30 meilleures offres, avec une raison courte gardée en base.
- **Libellés** : ≥ 80 « Excellent match » ; 60 à 79 « Bon match » ; 40 à 59 « À explorer » ; < 40 non affiché.
- **Explication** générée par le code, une phrase : ce qui correspond (2 ou 3 éléments) et ce qui manque (1 ou 2 éléments). Elle n'est jamais inventée par l'IA.

### 4.8 Analyse du CV

Section **« Mon CV »** de la page **Profil** (pas de page séparée). L'analyse du profil LinkedIn est **reportée à la version 2**.

- Dépôt d'un CV en PDF. 5 Mo maximum. Le texte est extrait (pdf-parse), le **fichier est supprimé** juste après. On conserve le **texte extrait** (nécessaire pour comparer le CV aux offres), le résultat de l'analyse et l'empreinte du fichier pour le cache. Bouton **« Supprimer mon CV »** qui efface le texte et les analyses. Un seul CV actif par utilisateur (le nouveau remplace l'ancien).
- **Analyse par règles** (gratuite, tous métiers) : longueur (1 page conseillée pour un junior, alerte au-delà de 2), sections présentes (expériences, formation, compétences, langues, contact), email et téléphone, lien LinkedIn, dates manquantes, présence de résultats chiffrés, formulations creuses (« motivé », « dynamique », « curieux »…), mots-clés du métier visé absents. Règles propres à certains secteurs (GitHub ou portfolio pour le développement et le design) sans jamais pénaliser les autres.
- Résultat : un score sur 100 et une liste de conseils classés par importance (✅ / ⚠️), chacun avec une action concrète.
- **Analyse IA** (Premium) : ressenti global en 3 phrases, 3 à 5 points forts, 3 à 5 améliorations, et jusqu'à 5 reformulations « avant → après » de phrases réelles du CV. Jamais d'invention d'expérience ou de compétence.
- **Comparer mon CV à une offre** (bouton dans le détail d'une offre) :
  - **par règles** (gratuit) : liste des compétences demandées par l'offre, chacune marquée **présente dans ton CV**, **dans ton profil mais absente du CV** (« tu l'as indiquée dans ton profil, ajoute-la à ton CV ») ou **absente** ; mots-clés importants du titre et de la description absents du CV ; 2 ou 3 conseils concrets générés par règles (« Ajoute Docker dans ta section Compétences », « Précise ton niveau d'anglais ») ;
  - **par l'IA** (Premium, en plus) : 3 à 5 conseils personnalisés pour adapter le CV à cette offre, et jusqu'à 3 phrases du CV réécrites pour mieux correspondre à l'offre, chacune avec un bouton **« Copier »** (l'utilisateur la colle lui-même dans son CV). **Jamais d'invention** d'expérience ou de compétence : l'IA ne fait que reformuler ou mettre en avant ce qui existe déjà, et le signale si une compétence demandée n'apparaît nulle part.
  - Si l'utilisateur n'a pas encore déposé de CV : le bouton l'invite à le faire (« Dépose ton CV pour le comparer à cette offre »), puis revient sur l'offre.
  - Résultat affiché dans un panneau simple, en 3 blocs : « Ce qui colle », « Ce qui manque », « Ce que tu peux faire ». Mis en cache par CV + offre.
- **Pré-remplir le profil depuis le CV** : extraction (règles + IA) du métier, des compétences, de la ville, du niveau d'études ; l'utilisateur valide champ par champ.
- Mention claire : le document est analysé localement (Ollama) ; si un fournisseur d'IA en ligne est configuré plus tard, l'utilisateur en est informé avant l'envoi.

### 4.9 Tableau de bord

- **En haut, une seule ligne d'accueil utile** (pas de grande bannière) : « Salut Frédéric » suivi de ce qu'il y a à faire aujourd'hui (« 3 entreprises à buzzer », « Ton automatisation t'a envoyé 4 offres ce matin », « Rien d'urgent aujourd'hui »).
- **Carte « Bien démarrer »** (nouveaux utilisateurs) : une petite liste qui se coche au fur et à mesure, avec une barre de progression verte : Profil rempli, Première recherche d'offres, Automatisation activée, Première candidature notée, CV déposé. Chaque ligne non cochée est un lien direct vers l'action. Quand tout est coché : un petit « buzz » (le « zz » vibre, message « Tu es prêt, à toi de jouer ») puis la carte disparaît définitivement. Elle peut aussi être fermée à la main (« Masquer »). États calculés à partir des données existantes, sauf la première recherche (`User.firstSearchAt`) et la fermeture (`User.startChecklistDismissedAt`).
- **Chiffres d'activité** (cartes avec une icône lucide et un chiffre en JetBrains Mono : candidatures, relances envoyées, réponses, entretiens) affichés **seulement quand il y a de l'activité** ; jamais une rangée de « 0 » pour un nouvel utilisateur (la carte « Bien démarrer » prend la place). Une seule couleur d'accent (vert) : pas une couleur différente par carte.

- **« Tes buzz du jour »** : les relances à faire aujourd'hui (3 premières + lien vers la liste), avec le bouton « Buzzer ».
- État des automatisations : nombre actives, dernier mail envoyé, une automatisation en erreur si c'est le cas.
- **Récap de la semaine** : « 5 relances envoyées, 2 réponses, 1 entretien : ça bouge ! » (calculé sur 7 jours glissants).
- **Bouton « J'ai trouvé ! »** (sur l'accueil, discret, et dans Profil → Paramètres) : l'utilisateur indique ce qu'il a décroché (stage, alternance, CDD, CDI) et, s'il le veut, l'entreprise. Écran de félicitations avec une animation verte, puis :
  - proposition de **mettre toutes ses automatisations en pause** (un bouton, sans obligation) ;
  - **une seule question** : « Jobzz t'a aidé à trouver ? » → Oui, beaucoup / Un peu / Pas vraiment, avec un commentaire facultatif ;
  - possibilité d'annuler (« Finalement, je cherche encore ») qui rouvre la recherche.
  C'est la meilleure preuve de valeur de Jobzz : ces chiffres alimentent les statistiques de l'admin.
- Accès rapides : « Chercher des offres », « Nouvelle automatisation », « Écrire à une entreprise ».
- États vides soignés pour un nouvel utilisateur.

### 4.10 Aide et support

- Accès par un petit bouton **« ? »** en bas du menu (pas une entrée principale), qui ouvre la page Aide avec deux onglets : **« Questions fréquentes »** et **« Mes demandes »**.
- **Questions fréquentes** : FAQ dans un fichier Markdown du dépôt (`content/faq.md`), facile à modifier. Une vingtaine de questions couvrant chaque fonctionnalité.
- **Ticket** : type (bug, question, idée), sujet, message, capture d'écran facultative (PNG, JPEG ou WebP, 2 Mo maximum, type réel vérifié, stockée hors du dossier public et servie uniquement à l'auteur et à l'admin).
- **Onglet « Mes demandes »** : liste des tickets (ouvert, en cours, résolu) avec fil de conversation. Mail à l'utilisateur quand l'admin répond, mail à l'admin quand un ticket est créé (Mailpit en local).

### 4.11 Espace admin

Accessible uniquement au rôle `admin` (vérifié côté serveur). Entrée « Admin » dans le menu, visible uniquement pour l'admin. **Thème noir et blanc** (section 11).

- **Santé du système** (page d'accueil de l'admin) : état de chaque source d'offres (dernière réussite, dernière erreur, taux d'erreur sur 24 h), disponibilité de l'IA et temps de réponse moyen, longueur des files pg-boss, exécutions d'automatisations des dernières 24 h (réussies, partielles, en échec), mails envoyés aujourd'hui, nombre d'utilisateurs et d'automatisations actives. Bouton **« Lancer les automatisations maintenant »**.
- **Statistiques** (onglet à côté de « Santé du système ») : en haut, **4 grands chiffres** : **utilisateurs inscrits au total**, **utilisateurs actifs cette semaine**, **nouveaux inscrits cette semaine**, **abonnés Premium**, chacun avec son évolution par rapport à la semaine précédente. En dessous, les chiffres business, avec l'évolution semaine par semaine sur les 12 dernières semaines :
  - **utilisateurs actifs** sur 7 jours (connexion ou action, via `lastActiveAt` mis à jour au plus une fois par heure) et sur 30 jours ;
  - **nouveaux inscrits** par semaine ;
  - **part de Premium** (mensuel, Pass 3 mois, offre de lancement, séparément) ;
  - **durée moyenne d'abonnement**, à partir des périodes d'abonnement (`SubscriptionPeriod`) ;
  - **entretiens obtenus** (candidatures marquées « Entretien ») ;
  - **« J'ai trouvé ! »** : nombre d'utilisateurs, répartition par type de contrat, et réponses à « Jobzz t'a aidé ? » ;
  - quelques chiffres d'usage : automatisations actives, offres envoyées par mail, relances envoyées ;
  - **répartition des inscrits par niveau d'expérience** (débutant, moins de 1 an, 1 à 3 ans, plus de 3 ans) : si la part « plus de 3 ans » devient importante, c'est le signal qu'une demande existe au-delà des juniors.
  Chiffres **agrégés uniquement** (aucune donnée personnelle affichée). Les chiffres d'abonnement viennent des `SubscriptionPeriod` (paiements de test en local, réels en production) ; tant qu'il n'y en a aucun, l'écran affiche « Pas encore d'abonnement » plutôt que des chiffres faux. Les paiements de test sont signalés comme tels. Le seed démo crée quelques données pour que les autres graphiques s'affichent.
- **Tickets** : liste filtrable (type, statut), fil, réponse, changement de statut.
- **Utilisateurs** : liste en lecture seule (email, date d'inscription, plan, nombre de candidatures et d'automatisations), sans accès au contenu de leurs candidatures. Actions : changer le plan (pour les tests), désactiver un compte.
- Pas de journal d'audit en v1 (reporté à la version 2, utile seulement avec plusieurs admins).

**Mon compte** : un seul compte avec le rôle `admin`, qui utilise aussi l'appli normalement et a toujours tout le Premium sans limites. Créé uniquement au démarrage depuis `ADMIN_EMAIL` / `ADMIN_PASSWORD` s'il n'existe pas, ou via `pnpm --filter api create-admin`. Jamais via l'interface publique.

### 4.12 Mes données (RGPD)

- Section **« Mes données »** dans **Profil → Paramètres** (avec l'interrupteur du mail des offres et le changement de mot de passe).
- **Exporter** : un ZIP contenant un JSON par type de données (profil, candidatures, relances, automatisations, CV et analyses, comparaisons CV / offre, tickets, « J'ai trouvé ! »).
- **Supprimer mon compte** : confirmation en retapant son email ; suppression définitive et immédiate de toutes les données et fichiers ; mail de confirmation.
- Texte clair : quelles données, pourquoi, combien de temps. Mention que les emails de recruteurs saisis par l'utilisateur sont des données de tiers, utilisées uniquement pour ses propres relances.

### 4.13 Bonus (seulement quand tout le reste est terminé)

Préparation d'entretien à partir d'une offre et du CV ; fiche entreprise détaillée (API Recherche d'entreprises) ; application installable sur mobile (PWA).

### 4.14 Reporté à la version 2 (ne pas coder maintenant, noter dans `docs/V2.md`)

La **version 2** regroupe les idées gardées de côté : elles seront ajoutées après les retours des premiers utilisateurs.

- **Import d'un fichier Excel / CSV** de candidatures (avec détection automatique des colonnes et des dates françaises).
- **Relances plus complètes** : 2e relance automatique, passage automatique en « Sans réponse », statuts détaillés.
- **Analyse du profil LinkedIn** (export PDF), en plus de celle du CV.
- **« Entreprises qui recrutent en alternance »** de La bonne alternance (recruteurs sans offre publiée) dans les automatisations et le mail, pour des candidatures spontanées.
- **Offres des pages carrières des entreprises**, via les **flux publics des logiciels de recrutement** (Teamtailor, Recruitee, Welcome Kit, Lever, Greenhouse, Workable…) : un connecteur `JobSource` par logiciel, jamais de scraping des sites. À vérifier avant de coder : existence du flux public pour chaque logiciel, conditions d'utilisation (reprise des offres, envoi par mail, usage payant), et façon de constituer la liste des entreprises suivies.
- **« Mon CV adapté à cette offre »** (Premium) : Jobzz génère un vrai CV d'**1 page**, adapté à une offre, à partir du contenu de l'utilisateur.
  - **Contenu structuré** : expériences, formation, compétences, langues, projets, texte de profil, chacun dans sa case ; pré-rempli depuis le CV PDF déposé, vérifié et corrigé par l'utilisateur. Permet aussi de créer un CV de zéro.
  - **2 ou 3 modèles** sobres, lisibles par les logiciels de recrutement ; la mise en page d'origine du PDF n'est **pas** reproduite (impossible de façon fiable). Option secondaire : un CV déposé en Word (.docx) peut être modifié en gardant sa mise en page, si sa structure le permet.
  - **Le contenu reste celui de l'utilisateur (règle stricte)** :
    - le **CV de base** n'est jamais modifié ; chaque version adaptée est une copie ;
    - **jamais modifiés** : intitulés de poste, entreprises, écoles, dates, noms et contenu des projets, chiffres, technologies, diplômes, texte de profil ;
    - **par défaut, aucune réécriture** : Jobzz ne fait que **réorganiser** (ordre des expériences et des compétences) et **mettre en avant** (compétences demandées par l'offre en premier) ;
    - **réécriture uniquement sur demande**, phrase par phrase, avec l'avant / après affiché et un bouton « Accepter » ; refusé par défaut ;
    - l'utilisateur peut **verrouiller** un bloc (« Ne pas toucher ») ;
    - jamais d'ajout d'expérience, de compétence ou de résultat qui n'existe pas.
  - **1 page garantie** : si ça déborde, Jobzz propose de masquer les éléments les moins utiles pour cette offre (jamais supprimés du CV de base), puis réduit l'espacement ; il prévient toujours et ne coupe jamais en silence.
  - Export PDF (et Word), aperçu avant export, versions adaptées listées par offre.
- **Journal d'audit** de l'admin.
- Types d'envoi libre supplémentaires (demande de retour après un refus).
- Thème clair.

### 4.15 Hors périmètre (ne pas faire)

Envoi de mails depuis le serveur au nom de l'utilisateur, connexion OAuth Gmail ou Outlook, candidatures ou relances envoyées automatiquement, scraping, recherche d'emails ou de profils de recruteurs, chat en direct, application mobile native.

---

## 5. Intelligence artificielle

- **Couche d'abstraction** `AiProvider` : `generateJson<T>(prompt, zodSchema, options)` et `generateText(prompt, options)`. Implémentation par défaut : **Ollama** (`OLLAMA_URL`, `OLLAMA_MODEL`), avec la sortie structurée par schéma JSON. Une implémentation pour un fournisseur en ligne pourra être ajoutée plus tard sans changer le reste du code.
- **Modèle** : par défaut un modèle récent d'environ 7 à 8 milliards de paramètres, bon en français et en sortie JSON, utilisable sur un ordinateur portable correct. Configurable. Script `pnpm ai:pull` pour le télécharger.
- **Toutes les sorties sont validées par Zod.** Sortie invalide → une nouvelle tentative avec le message d'erreur, puis abandon et repli sans IA.
- **Délais maximum** : 45 s pour l'analyse d'une demande d'automatisation (avec indicateur de progression), 30 s pour un message, extractions en tâche de fond. Délai dépassé → repli sans IA, sans bloquer l'utilisateur.
- **Cache** par empreinte (texte de la demande, offre + version de l'enrichissement, empreinte du CV).
- **Sécurité** : le texte des offres et des CV est une **donnée non fiable**. Il est placé dans des balises clairement délimitées, le prompt système indique de ne jamais suivre d'instructions qu'il contient, et l'IA ne peut déclencher **aucune action** : elle renvoie seulement des données validées.
- **Prompts** versionnés dans des fichiers dédiés (`apps/api/src/ai/prompts/`), avec des tests sur des exemples (demandes d'automatisation variées, offres types) vérifiant que la sortie respecte le schéma.
- **Journal** des appels (fonctionnalité, modèle, durée, succès), sans le contenu, pour la page Santé.
- Indicateur visuel sobre sur tout contenu généré par l'IA.

---

## 6. Modèle de données (principales entités Prisma)

Toutes les tables ont `id` (UUID), `createdAt`, `updatedAt`. Index sur toutes les clés étrangères et colonnes de filtre ou de tri.

- **User** : email (unique), passwordHash, role, plan, premiumUntil?, stripeCustomerId?, emailVerifiedAt, offerMailEnabled, lastOfferMailAt, lastActiveAt (indexé), disabledAt, firstSearchAt?, startChecklistDismissedAt?.
- **SubscriptionPeriod** : userId, offer (`monthly`, `pass_3_months`, `launch`), stripeSubscriptionId?, stripePaymentIntentId?, status, startedAt, endedAt?. Alimentée par les webhooks Stripe.
- **StripeEvent** : stripeEventId (unique), type, processedAt (idempotence des webhooks).
- **JobOutcome** (« J'ai trouvé ! ») : userId, contractType, companyName?, helpfulness (`beaucoup`, `un_peu`, `pas_vraiment`)?, comment?, foundAt, cancelledAt?.
- **RefreshToken** : userId, tokenHash, expiresAt, revokedAt, replacedById, userAgent.
- **EmailToken** : userId, type (`verify`, `reset`), tokenHash, expiresAt, usedAt.
- **Profile** : userId (unique), identité, liens, jobTargets (JSON : libellé + codes ROME), skills, sectors, locations (JSON : code INSEE, libellé, lat, lng, rayon), remotePreference, educationLevel, educationField, availableFrom, contractTypes, alternance (JSON), internship (JSON), experienceLevel.
- **Application** (candidature) : userId, companyName, companyKey, position, positionKey, contactEmail, contactName, appliedAt, source (`offer`, `free_send`), offerId?, offerUrl?, status (`en_attente`, `relancee`, `reponse_recue`), responseType?, archivedAt?, followUpCount, lastFollowUpAt, nextFollowUpAt (indexé), respondedAt.
- **FollowUp** : applicationId, kind (`relance`, `relance_encore`, `spontanee`, `remerciement`, `linkedin`), channel (`gmail`, `outlook`, `mailto`, `copy`), subject, body, aiGenerated, sentAt.
- **Offer** : source, externalId (unique avec source), url, title, titleKey, companyName, companyKey, siret?, locationLabel, communeCode?, lat?, lng?, contractType, contractNature?, remote?, startDate?, startFlexible?, durationMonths?, experienceRequired?, salaryText?, skills, romeCodes, description, publishedAt, sourceUpdatedAt, fetchedAt, contentHash, isDemo.
- **OfferEnrichment** : offerId, version, attributes (JSON), confidence (JSON), method (`rules`, `ai`).
- **Company** : siren?, nameKey, name, headcountBand, category, naf, createdOn, labels, fetchedAt.
- **OfferInteraction** : userId, offerId, type (`hidden`, `applied`).
- **Automation** : userId, name, requestText, criteria (JSON, avec `schemaVersion`), status, lastRunAt, lastSuccessAt, consecutiveFailures.
- **AutomationRun** : automationId, startedAt, finishedAt, status (`success`, `partial`, `failed`), funnel (JSON), errors (JSON).
- **AutomationMatch** : automationId, offerId (unique ensemble), userId, score, explanation, aiAdjustment?, aiReason?, status (`pending`, `sent`, `skipped`), digestId?.
- **OfferDigest** : userId, sentAt, offerCount.
- **UsageCounter** : userId, feature, periodStart, count (unique ensemble).
- **OfferView** : userId, offerId, day (date à Paris) (unique ensemble) : offres vues dans la journée, pour la limite du gratuit ; purge automatique des lignes de plus de 7 jours.
- **CvDocument** : userId (unique : un CV actif), extractedText, fileHash, uploadedAt.
- **CvAnalysis** : userId, fileHash, rulesResult (JSON), aiResult (JSON)?.
- **CvOfferComparison** : userId, offerId, fileHash, rulesResult (JSON), aiResult (JSON)? (unique : userId + offerId + fileHash).
- **Ticket** : userId, type, subject, status. **TicketMessage** : ticketId, authorId, body, attachmentPath?.
- **AiCallLog** : feature, model, durationMs, success.

---

## 7. Stack et architecture

**TypeScript partout.** Choix définitifs.

- **Monorepo pnpm** : `apps/web` (Angular), `apps/api` (NestJS), `packages/shared` (schémas Zod, types, constantes de configuration partagées, matrice de faisabilité).
- **Front : Angular** (dernière version stable), pratiques modernes : composants standalone, signals, nouvelle syntaxe de templates (`@if`, `@for`, `@defer`), `inject()`, routes chargées à la demande, Reactive Forms typés. **Tailwind CSS**, composants sur mesure avec l'**Angular CDK** (fenêtres, menus, accessibilité). **Pas d'Angular Material.** Icônes **lucide-angular**. Données via `HttpClient` + services à base de signals avec cache simple. Animations avec les outils recommandés par la version d'Angular utilisée, en respectant `prefers-reduced-motion`. Code **clair, idiomatique et simple** : j'apprends Angular.
- **Back : NestJS**, un module par domaine (`auth`, `users`, `profile`, `applications`, `followups`, `offers`, `sources`, `scoring`, `automations`, `ai`, `cv`, `mail`, `support`, `admin`, `entitlements`, `billing`, `privacy`). **Prisma** + PostgreSQL. Validation **Zod** (schémas partagés). Logs structurés (pino) sans données personnelles.
- **Tâches en arrière-plan : pg-boss** (planification, files, nouvelles tentatives). Pas de n8n.
- **Paiement** : SDK officiel **Stripe** pour Node (Checkout, portail client, webhooks), module NestJS `billing`.
- **Fichiers** : pdf-parse (PDF).
- **Mails** : Nodemailer derrière une interface `MailSender` ; gabarits **MJML** (rendus côté serveur) + version texte. Local : **Mailpit**.
- **Référentiels** : ROME (France Travail), communes (geo.api.gouv.fr), entreprises (API Recherche d'entreprises), tous mis en cache.
- **Docker Compose** : PostgreSQL, Mailpit, et Ollama dans un profil facultatif (`docker compose --profile ai up`) ; Ollama installé sur la machine fonctionne aussi.
- **Fuseau horaire** : toutes les dates en UTC en base ; règles métier (week-ends, heures calmes, échéances) en `Europe/Paris`.
- **Langue** : interface en français uniquement, textes regroupés dans des fichiers (pas de chaînes dispersées), pour faciliter une traduction future.

---

## 8. Performance

- Front : Lighthouse ≥ 90 (performance, accessibilité, bonnes pratiques) sur mobile ; routes et blocs lourds chargés à la demande ; polices auto-hébergées (2 graisses par police) ; mises à jour optimistes (« Marquer comme relancé ») ; recherche avec délai de saisie ; pagination partout ; skeletons pendant les chargements.
- Back : index adaptés, pas de requêtes en cascade, pagination côté serveur, tâches lourdes (CV, IA, automatisations) en arrière-plan.
- Sources : cache des réponses (10 minutes pour la recherche manuelle), cache des référentiels (7 jours), file d'attente respectant les quotas, requêtes mutualisées entre automatisations, offres stockées une seule fois.
- IA : cache, appliquée seulement aux offres déjà filtrées, délais maximum.

---

## 9. Sécurité et RGPD

- Secrets uniquement dans `.env` (jamais dans le code ni côté front), `.env` dans `.gitignore`, `.env.example` complet et commenté.
- Vérification d'accès sur chaque ressource (un utilisateur ne voit que ses données), testée.
- Fichiers : type réel vérifié, tailles limitées, noms aléatoires, stockés hors du dossier public, supprimés dès que possible (CV).
- Jetons d'email hachés, à usage unique, à durée limitée.
- Aucune donnée personnelle dans les logs ni dans les journaux d'appels IA.
- Données minimales : on ne stocke que ce qui sert une fonctionnalité.

---

## 10. Configuration

Toutes les valeurs métier sont dans **un seul fichier de configuration typé** (`packages/shared/src/config.ts`), avec les valeurs par défaut de ce document : délais de relance, limites des offres, poids et seuils du score, fréquence des automatisations, écart entre mails, heures calmes, nombres d'offres par mail, délais IA, tailles de fichiers.

Variables d'environnement (dans `.env.example`) : `DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `APP_URL`, `API_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SMTP_HOST`, `SMTP_PORT`, `MAIL_FROM`, `JOB_SOURCES_MODE` (`demo` | `live`), `FRANCE_TRAVAIL_CLIENT_ID`, `FRANCE_TRAVAIL_CLIENT_SECRET`, `LBA_API_KEY`, `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `OLLAMA_URL`, `OLLAMA_MODEL`, `AI_ENABLED`, `PLAN_ENFORCEMENT`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_LAUNCH`, `STRIPE_PRICE_PASS_3_MONTHS`, `APP_NAME` (« Jobzz »), `BETA_INVITE_CODE` (facultatif : inscription sur invitation pendant la bêta).

Le **nom de l'application** est défini à un seul endroit (`APP_NAME`) et utilisé partout (titre, logo texte, mails).

---

## 11. Design

### Identité

- **Jobzz** (nom provisoire) : « job » + le « zz » de **buzz**, mon surnom. Le buzz, c'est la vibration d'une notification, et faire le buzz, c'est se faire remarquer.
- **Logo** : le mot « Jobzz » en Space Grotesk, le « zz » en vert avec deux petits arcs de vibration. Favicon : « zz » seul. **Aucune référence à Buzz l'Éclair.**
- **Authentique**, pas « template » : pas de dégradés violets, pas d'illustrations 3D, pas d'emojis partout, pas de cartes toutes identiques. Une identité qu'on reconnaît.

### Design system (à appliquer tel quel ; documenté dans `docs/DESIGN.md`)

- **Thème sombre uniquement** en v1, entièrement en variables CSS (thème clair possible plus tard).
- **Couleurs** :
  - fond `#0B0D0C`, surface `#141816`, surface relevée `#1C211E`, bordure `#2A302C` ;
  - texte `#F2F5F3`, texte secondaire `#A3ADA7`, texte discret `#6B756F` ;
  - **accent vert** `#3BE38B`, survol `#62EDA3`, fond d'accent `#0F3D26` ; texte sur bouton vert : `#0B0D0C` ;
  - erreur `#F2555A`, avertissement `#F5B841`.
  - Vérifier tous les contrastes (WCAG AA minimum).
- **Thème admin (noir et blanc)** : mêmes fonds ; accent `#F2F5F3`, survol `#FFFFFF`, fond d'accent `#2A2E2C`, texte sur bouton : `#0B0D0C`. Seules les couleurs de sens restent : **jaune `#F5B841` = avertissement** (état « Dégradé »), **rouge `#F2555A` = erreur** (état « En panne », suppression). Badge permanent « Mode admin » et bouton « Retour à l'appli ». Thème appliqué par une classe sur la racine de l'espace admin. **Tout l'espace admin est en noir et blanc, y compris les graphiques et indicateurs des statistiques et de la santé du système** : séries différenciées par des nuances de gris, des lignes pleines ou en pointillés et des libellés directs (jamais par la couleur seule) ; états de santé indiqués par une icône, un mot **et** une couleur : **OK** en blanc, **Dégradé** en jaune (ça marche encore mais il faut surveiller : source lente, quelques erreurs), **En panne** en rouge (c'est cassé, il faut agir). Aucun vert dans l'admin.
- **Légende des couleurs toujours visible dans l'admin** : une petite ligne discrète en haut de « Santé du système » (« ● Blanc : OK · ● Jaune : à surveiller · ● Rouge : en panne »), et la même légende sous chaque graphique ou tableau qui utilise une couleur. Les couleurs gardent **le même sens partout** dans Jobzz (appli et admin) : jaune = avertissement, rouge = erreur, vert = action principale (appli uniquement). Ce code couleur est aussi documenté dans `docs/DESIGN.md`.
- **Admin clair et lisible avant tout** :
  - en haut de chaque page, les **3 à 4 chiffres les plus importants** en grand (police mono, taille 32 px minimum), avec l'évolution par rapport à la semaine précédente écrite en clair (« +12 % vs semaine dernière ») ;
  - **un seul message par graphique**, avec un titre qui dit ce qu'il faut retenir (« Utilisateurs actifs : en hausse depuis 3 semaines ») ; maximum 3 courbes par graphique ;
  - texte d'au moins 14 px, contrastes forts (texte principal blanc sur fond noir, gris uniquement pour les informations secondaires, WCAG AA minimum) ;
  - tableaux aérés : une ligne sur deux légèrement plus claire, colonnes alignées (chiffres à droite), en-têtes fixes au défilement ;
  - beaucoup d'espace, peu d'éléments par écran, aucune décoration inutile ;
  - les problèmes en premier : sur « Santé du système », ce qui est dégradé ou en panne apparaît tout en haut, le reste est résumé en une ligne « Tout fonctionne ».
- **Typographie** (auto-hébergée via Fontsource) : titres **Space Grotesk** (600, 700) ; texte **Inter** (400, 500) ; chiffres, scores, badges et raccourcis **JetBrains Mono** (500).
- **Formes** : rayon 12 px pour les cartes, 8 px pour les champs et boutons, pilules pour les badges. Bordures fines plutôt qu'ombres. Espacements sur une grille de 4 px, beaucoup d'air.
- **Mouvement** : 150 ms pour les survols, 250 ms pour les apparitions, courbes douces ; skeletons au lieu de spinners ; tout désactivé avec `prefers-reduced-motion`.
- **Responsive** : mobile d'abord ; navigation latérale sur ordinateur, barre en bas sur mobile.
- **Accessibilité** : navigation complète au clavier, focus visible (anneau vert, blanc en admin), libellés sur tous les champs, textes alternatifs.

### Maquettes de référence (`docs/maquettes/`)

Sept maquettes validées, en HTML statique, à ouvrir dans un navigateur avant de coder les écrans concernés :
- `01-accueil-nouvel-utilisateur.html` : tableau de bord d'un nouvel utilisateur (ligne d'accueil, carte « Bien démarrer », accès rapides) ;
- `02-accueil-utilisateur-actif.html` : tableau de bord d'un utilisateur actif (chiffres d'activité, « Tes buzz du jour », automatisations, récap de la semaine, « J'ai trouvé ! ») ;
- `03-offre-et-comparaison-cv.html` : détail d'une offre (score en anneau, compétences en pastilles, boutons) et panneau « Ton CV face à cette offre » (Ce qui colle / Ce qui manque / Ce que tu peux faire, bloc IA avec « Copier ») ;
- `04-recherche-gratuit.html` : onglet « Rechercher » d'un compte gratuit (filtres du profil, « 38 offres te correspondent », offres classées avec rang et score, compteur du jour, encadré de limite avec le vrai nombre d'offres restantes, offres suivantes floutées) ;
- `05-mes-automatisations-premium.html` : onglet « Mes automatisations » d'un compte Premium (petit badge « Premium » sous le logo, « 2 actives sur 5 » et prochain passage, bouton « Nouvelle automatisation », une carte par automatisation avec résumé, statut, dernier mail, « Ces 4 dernières semaines : N offres » et actions, bloc « Pourquoi je n'ai rien reçu ? » avec l'entonnoir et des suggestions en un clic, automatisation en pause, section « Et sur les autres sites ») ;
- `06-nouvelle-automatisation-ia.html` : création d'une automatisation décrite avec ses mots, écran 2 (demande modifiable, « Voici ce que j'ai compris » avec résumé, prévision et nom, question de précision en boutons, ligne dépliable Fiable / Approximatif / Impossible, 3 exemples d'offres, « Activer » et « Modifier les critères ») ;
- `07-criteres-automatisation.html` : formulaire des critères d'une automatisation (ouvert par « Modifier », « Modifier les critères » ou « Remplir le formulaire ») : nom, métier en pastilles, contrat en boutons avec rythme, lieux et télétravail, mois de début, compétences et technos en pastilles (★ = indispensable, suggestions en un clic), mots à éviter, section « Plus de critères » (type d'entreprise, exclure les ESN, fraîcheur, exigence), badges « Approximatif » à côté des critères concernés, et à droite la **prévision** qui se met à jour (« environ 3 nouvelles offres par semaine », d'après les 2 dernières semaines, sans entonnoir) avec le bouton « Activer ». Pré-rempli depuis le profil.

Elles fixent **l'esprit, la disposition, les couleurs, la typographie et le ton** : reproduis-les fidèlement en composants Angular + Tailwind (version mobile comprise : le menu latéral devient la barre du bas). Ce ne sont pas du code à copier : les polices y sont chargées depuis Google Fonts pour l'aperçu, l'appli les auto-héberge (Fontsource). Les entreprises et chiffres sont fictifs. **En cas de différence, ce cahier des charges l'emporte.** Copie ces fichiers tels quels dans le dépôt, sous `docs/maquettes/`.

### Une UX qui me ressemble

- **Signature « buzz »** : le « zz » du logo vibre légèrement quand il y a des relances à faire. Avec parcimonie.
- **Vocabulaire** : « Buzzer » (relancer), « Tes buzz du jour » (relances du jour). Le reste reste clair et simple.
- **Ton** : tutoiement, phrases courtes, encourageant, jamais culpabilisant (« Un refus, c'est une case de moins à cocher. Prochaine ! »). Aucun jargon technique dans les textes.
- **Célébrations** : animation verte légère quand un entretien est obtenu.
- **Clins d'œil dev** : palette de commandes `Ctrl+K` / `Cmd+K` (naviguer, « Chercher des offres », « Nouvelle automatisation », « Écrire à une entreprise »), raccourcis affichés dans les menus, petit message caché dans la console du navigateur.
- **Page « Pourquoi Jobzz »** : texte provisoire à la première personne, que je réécrirai.

### Navigation : 4 entrées seulement

| Menu | Contenu |
|---|---|
| **Accueil** | Tes buzz du jour, état des automatisations, récap de la semaine, accès rapides |
| **Relances** | Onglets « À buzzer » (par défaut) et « Mes candidatures » ; bouton « Écrire à une entreprise » |
| **Offres** | Onglets « Rechercher » (par défaut) et « Mes automatisations » (avec la section « Et sur les autres sites ») ; bouton « Nouvelle automatisation » |
| **Profil** | Sections « Mes infos », « Mon CV » (analyse), « Paramètres » (mail des offres, Mon abonnement, mot de passe, Mes données) |

- En bas du menu : un petit bouton **« ? »** (Aide : questions fréquentes et Mes demandes) et, **uniquement pour l'admin**, l'entrée « Admin ».
- Sur mobile : barre en bas avec les 4 entrées ; « ? » dans l'en-tête.
- Badge discret sur « Relances » avec le nombre de buzz du jour.
- Les onglets sont des routes (lien partageable, bouton retour du navigateur qui fonctionne).

### Écrans (plan du site)

Public : `/`, `/tarifs`, `/connexion`, `/inscription`, `/verifier-email`, `/mot-de-passe-oublie`, `/reinitialiser-mot-de-passe`, `/pourquoi-jobzz`, `/desinscription`.
Application : `/app` (accueil), `/app/relances` (À buzzer), `/app/relances/candidatures`, `/app/offres` (Rechercher), `/app/offres/automatisations`, `/app/offres/automatisations/nouvelle`, `/app/offres/automatisations/:id`, `/app/profil`, `/app/profil/cv`, `/app/profil/parametres`, `/app/profil/abonnement`, `/app/premium/bienvenue`, `/app/aide`, `/app/aide/demandes`, `/app/bienvenue` (accueil guidé).
Admin : `/admin` (santé), `/admin/statistiques`, `/admin/tickets`, `/admin/tickets/:id`, `/admin/utilisateurs`.

---

## 12. Données de démonstration

- Script `pnpm seed` : compte **`demo@jobzz.local`** (mot de passe dans le README) avec profil complet, 12 candidatures aux statuts variés, des relances à faire aujourd'hui, des candidatures déjà relancées, une candidature sans email (autre canal LinkedIn), un entretien, 2 automatisations (une active, une en pause) avec un historique d'exécutions. Un compte **`gratuit@jobzz.local`** en plan `free`, pour tester les limites avec `PLAN_ENFORCEMENT=true`. Quelques autres comptes fictifs (activité sur plusieurs semaines, entretiens, « J'ai trouvé ! ») pour alimenter les statistiques de l'admin. **Entreprises et personnes clairement fictives.**
- Le seed et le compte démo ne s'exécutent **jamais** en production (`NODE_ENV=production` les bloque).

---

## 13. Tests et qualité

- **Vitest** pour le back et `packages/shared` ; outil de test recommandé par la version d'Angular pour le front.
- Tests unitaires obligatoires : règle de relance et calcul des échéances (week-ends compris), statuts des candidatures, doublons, filtres et score (cas limites), module `entitlements` (avec `PLAN_ENFORCEMENT=true` et `false`), limite des offres vues (25 par jour, une offre comptée une seule fois, remise à zéro à minuit heure de Paris, vrai nombre d'offres restantes), calculs des statistiques de l'admin (actifs, durée d'abonnement, « J'ai trouvé ! »), mutualisation des requêtes, génération des recherches pour l'aide aux alertes (chaque site), comparaison CV / offre par règles (compétence présente, dans le profil mais absente du CV, absente), **filtre junior** (chaque niveau d'expérience, mots du titre, motifs du texte, exceptions « alternance » / « stage » / « junior », « community manager » jamais écarté), règle des mails (4 h, heures calmes, maximums, mail hebdomadaire de l'automatisation découverte avec priorité aux offres récentes et compteur d'offres manquées, passage Premium → gratuit), validation des sorties IA, connecteurs (avec réponses enregistrées, sans appel réel), **paiement** : traitement de chaque webhook Stripe (avec des événements simulés et signés), idempotence, refus des signatures invalides, Pass 3 mois et cumul des dates, limite des 100 abonnés de lancement, échec de paiement, retour au gratuit, refus des clés `sk_live_` hors production.
- Tests d'intégration des routes principales (accès refusé aux données d'un autre utilisateur, routes admin).
- **Playwright** : inscription → accueil guidé → recherche → « J'ai postulé » → relance → confirmation ; automatisation en 1 clic depuis le profil → activation ; automatisation décrite avec ses mots sans IA (formulaire) → aperçu → activation ; ticket → réponse admin.
- ESLint + Prettier, TypeScript strict, CI GitHub Actions (lint, types, tests, build).
- **Définition de « terminé » pour chaque étape** : fonctionne en local depuis un démarrage à zéro (`docker compose up`, `pnpm install`, `pnpm dev`), tests verts, aucune erreur de lint ou de types, README à jour, commit.

---

## 14. Plan de construction (phase 1, en local)

1. **Socle** : monorepo, Docker Compose, NestJS, Prisma (schéma complet), authentification complète (inscription, vérification, connexion, rafraîchissement, mot de passe oublié, déconnexion), rôles, création du compte admin, module `entitlements` (désactivé), Angular (squelette, design system, mise en page, thème admin), page d'accueil publique, pages d'authentification, CI, seed démo.
2. **Profil et accueil guidé** : référentiels communes et ROME, formulaire de profil, accueil guidé en 3 écrans.
3. **Candidatures et relances** : page Relances et ses onglets, statuts, « L'entreprise a répondu », règle et échéances (tâche quotidienne), modèles, formulaire d'envoi et liens, confirmation au retour, autre canal LinkedIn, envoi libre, tableau de bord.
4. **Couche IA** : `AiProvider`, Ollama, validation, cache, délais, repli ; messages de relance et d'envoi libre par IA.
5. **Offres** : connecteurs (démo, France Travail, La bonne alternance, Adzuna désactivé), normalisation, dédoublonnage, enrichissement par règles et entreprises, score, page Offres, bouton « J'ai postulé » relié aux relances, gestion des pannes.
6. **Automatisations** : schéma et matrice de faisabilité, aide aux alertes sur les autres sites, assistant IA, formulaire sans IA, aperçu et entonnoir, exécution pg-boss, enrichissement IA, mail des offres (MJML), désinscription, page de gestion et diagnostic.
7. **CV** : analyse par règles, analyse IA, pré-remplissage du profil (section « Mon CV » du Profil), **comparaison CV / offre** (par règles, puis IA) dans le détail d'une offre.
8. **Paiement (mode test)** : pages Tarifs et Mon abonnement, Stripe Checkout, portail client, webhooks, Pass 3 mois, offre de lancement, passage gratuit ↔ Premium, README « tester le paiement ».
9. **Support, admin et données** : aide (bouton « ? »), tickets, santé du système, statistiques, utilisateurs, bouton « J'ai trouvé ! », export et suppression des données.
10. **Finitions** : relecture de toute l'appli avec les yeux d'un nouvel utilisateur (chaque écran a une action principale claire, rien d'avancé n'est visible par défaut, la navigation reste à 4 entrées), palette `Ctrl+K`, célébrations, récap de la semaine, audit d'accessibilité et Lighthouse, tests Playwright, documentation (`README.md`, `docs/DECISIONS.md`, `docs/DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/V2.md`), `DEPLOIEMENT.txt`.
11. **Bonus** si tout est terminé.

À la fin de chaque étape : un résumé court (fait, comment tester, décisions prises), puis tu enchaînes sur l'étape suivante.

---

## 15. Apprentissage (sans jamais bloquer la construction)

Je veux comprendre mon propre code, mais **tu ne t'arrêtes jamais pour attendre mes réponses** : tout est préparé dans des fichiers que j'utilise quand je veux.

- **Questions** : à la fin de chaque étape, ajoute 3 questions sur ce qui vient d'être construit dans `docs/QUESTIONS.md`, de difficulté progressive (« Dans quel fichier se trouve la règle des 7 jours ? », puis « pourquoi » les choix, puis des questions plus techniques). Chaque question indique où regarder dans le code, et la réponse est cachée dans un bloc `<details>`. À la fin du projet, ajoute un **quiz final** de 10 questions de type entretien technique.
- **Exercices** : à chaque étape, choisis 1 ou 2 fonctions formatrices (par exemple le calcul des échéances de relance, un composant Angular de carte d'offre, un endpoint NestJS, une partie du score). Tu codes la vraie version dans l'application comme d'habitude, **et** tu crées dans `exercices/<numéro>-<nom>/` un fichier de départ (signature, description claire, sans la solution) avec **les mêmes tests**. Je pourrai réécrire la fonction moi-même et vérifier avec `pnpm exercice <numéro>`. Liste des exercices dans `exercices/README.md`.
- **Si je te le demande plus tard** (« lance le quiz », « relis mon exercice 3 »), tu poses les questions une par une, tu corriges avec une explication courte, ou tu relis mon code comme un collègue.
- Les explications ne vont jamais dans le code de l'application.

---

## 16. Phase 2 : mise en ligne (ne rien déployer)

Quand l'application locale est terminée, crée **`DEPLOIEMENT.txt`** à la racine : la liste ordonnée, étape par étape, de tout ce que je devrai faire pour la mise en ligne, avec une checklist finale :

- hébergement du front, du back, de PostgreSQL et des tâches pg-boss (options gratuites ou peu chères), et de l'IA (Ollama sur un serveur ou fournisseur en ligne : coûts et implications RGPD). Comparer les deux familles, avec avantages, inconvénients et prix à vérifier au moment de la mise en ligne :
  - **plateformes gérées** (Railway, Render pour l'API et la base ; Supabase ou Neon pour PostgreSQL seul) : aucune gestion de serveur. Avec Supabase, utiliser **uniquement la base PostgreSQL** (pas Supabase Auth, Storage ni d'accès direct depuis le front), vérifier la mise en pause des projets gratuits inactifs, et utiliser la connexion directe (ou le pooler en mode « session ») pour pg-boss et les migrations Prisma ;
  - **VPS** (IONOS, OVH, Hetzner…, données en Europe) : tout Jobzz sur un seul serveur avec Docker Compose, souvent le moins cher, mais tout est à gérer soi-même (mises à jour, pare-feu, SSH, HTTPS, sauvegardes de la base, redémarrage automatique). Un petit VPS ne suffit pas pour Ollama. Ne pas utiliser d'hébergement web mutualisé (incompatible avec NestJS et pg-boss) ;
  - dans tous les cas, seule `DATABASE_URL` change : le code ne dépend d'aucun hébergeur ;
- comptes et clés : France Travail, La bonne alternance, service d'envoi d'emails ;
- relecture des conditions d'utilisation des API pour un usage public et payant (affichage de la source, résumé d'offre dans un mail chez France Travail, interdiction de revente chez La bonne alternance, licence Adzuna) ;
- toutes les variables d'environnement de production ;
- envoi des mails : domaine d'envoi, SPF, DKIM, DMARC, `List-Unsubscribe`, tests Gmail / Outlook ;
- choix du nom définitif (vérifier « Jobzz » à l'INPI et à l'EUIPO : une application roumaine JobZZ.ro existe), nom de domaine, HTTPS ;
- **passage du paiement en mode réel** (le code est déjà fait et testé en mode test) : activation du compte Stripe (identité, coordonnées bancaires), création des produits et prix réels (Premium mensuel 9,99 €, Pass 3 mois 24,99 € en paiement unique, lancement 6 € par mois), clés de production, webhook de production pointant vers l'URL en ligne, réglages du portail client et des factures, activation éventuelle d'Apple Pay / Google Pay, un vrai paiement de vérification puis remboursement, compteurs visibles, `PLAN_ENFORCEMENT=true` ;
- pistes commerciales : partenariats avec les écoles (Premium offert à leurs étudiants), à commencer par Ynov ;
- statut juridique pour encaisser de l'argent (par exemple micro-entreprise), à vérifier auprès des sources officielles ;
- sécurité : secrets, CORS, limites de débit, sauvegardes automatiques de la base, **double authentification pour le compte admin**, suivi des erreurs ;
- pages légales et RGPD : mentions légales, politique de confidentialité (y compris les emails de recruteurs saisis par les utilisateurs), CGU et CGV, durées de conservation (par exemple suppression des comptes inactifs depuis 24 mois après un mail d'avertissement) ;
- estimation des coûts mensuels (à vérifier au moment de la mise en ligne) ;
- piste pour mieux couvrir les **stages** (sources partenaires ou sous licence) ;
- **une bêta privée avant le lancement public** (2 à 4 semaines) :
  - mise en ligne avec les vraies sources d'offres, inscription sur invitation (`BETA_INVITE_CODE`), 10 à 30 testeurs (amis, étudiants d'Ynov) ;
  - Premium offert aux testeurs (changement de plan depuis l'admin), paiement pas encore activé ;
  - **un groupe de discussion des testeurs** (WhatsApp, Discord, Telegram… au choix ; créé à la main, aucun code dans Jobzz, pas de chat intégré à l'appli), dont le lien est donné dans le mail d'invitation : échanges rapides, idées, entraide entre testeurs ; règles simples affichées dans le groupe (bienveillance, pas de pub, pas de données personnelles d'autres personnes) ;
  - retours recueillis par les tickets (type « idée » ou « bug », pour les problèmes à suivre) et par le groupe des testeurs ; questions à leur poser (les offres sont-elles pertinentes ? le mail des offres est-il utile ? qu'est-ce qui t'a perdu ?) ;
  - chiffres à regarder dans l'admin : utilisateurs actifs chaque semaine, automatisations créées, relances envoyées, entretiens, « J'ai trouvé ! » ;
  - critères pour passer au lancement public : pas de bug bloquant, des testeurs qui reviennent chaque semaine, des offres jugées pertinentes ;
  - au lancement : vider `BETA_INVITE_CODE`, activer le paiement réel, remercier les testeurs (par exemple l'offre de lancement à 6 € réservée en priorité) ;
- l'ordre conseillé des actions.
