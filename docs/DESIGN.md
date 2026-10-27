# Design system Jobzz

Résumé opérationnel du §11 de `CLAUDE.md`. Les maquettes de référence sont dans
[`docs/maquettes/`](./maquettes/). En cas de différence, `CLAUDE.md` l'emporte.

## Thème sombre (v1)

Toutes les couleurs sont des variables CSS (`apps/web/src/styles.css`, `:root`), pour permettre
un thème clair plus tard.

| Rôle | Variable | Valeur |
| --- | --- | --- |
| Fond | `--jz-bg` | `#0B0D0C` |
| Surface | `--jz-surface` | `#141816` |
| Surface relevée | `--jz-surface-raised` | `#1C211E` |
| Bordure | `--jz-border` | `#2A302C` |
| Texte | `--jz-text` | `#F2F5F3` |
| Texte secondaire | `--jz-text-secondary` | `#A3ADA7` |
| Texte discret | `--jz-text-muted` | `#6B756F` |
| Accent (vert) | `--jz-accent` | `#3BE38B` |
| Accent survol | `--jz-accent-hover` | `#62EDA3` |
| Fond d'accent | `--jz-accent-bg` | `#0F3D26` |
| Texte sur bouton vert | `--jz-accent-ink` | `#0B0D0C` |
| Erreur | `--jz-danger` | `#F2555A` |
| Avertissement | `--jz-warning` | `#F5B841` |

## Thème clair (par défaut en v1)

Le thème clair est actif par défaut ; bascule clair/sombre dans l'en-tête (l'admin reste noir et
blanc). Tokens dans `:root` (`apps/web/src/styles.css`). Les couleurs ont été **réglées pour
respecter WCAG AA** (vérifié par Lighthouse, voir plus bas) :

| Rôle | Variable | Valeur | Contraste |
| --- | --- | --- | --- |
| Fond | `--jz-bg` | `#F6F8F7` | — |
| Texte | `--jz-text` | `#0F1613` | — |
| Texte discret | `--jz-text-muted` | `#68726B` | 4,68:1 sur fond |
| Accent (vert) | `--jz-accent` | `#08833D` | bouton blanc/vert 4,86:1 ; texte vert 4,55:1 |
| Accent survol | `--jz-accent-hover` | `#067330` | — |
| Fond d'accent (pastilles) | `--jz-accent-bg` | `#F0FAF5` | texte accent 4,56:1 |
| Texte sur bouton vert | `--jz-accent-ink` | `#FFFFFF` | — |

> Le vert d'identité a été **foncé de `#0AA24E` à `#08833D`** : l'ancien ne passait pas AA
> (bouton blanc/vert 3,34:1, texte vert 3,13:1). Le nouveau reste un émeraude profond très proche
> à l'œil. Voir `docs/DECISIONS.md` (2026-10-27, Lighthouse).

## Code couleur (même sens partout)

- **Vert** = action principale (application uniquement, jamais dans l'admin).
- **Jaune `#F5B841`** = avertissement (« à surveiller »).
- **Rouge `#F2555A`** = erreur / suppression (« en panne »).

## Thème admin (noir et blanc)

Appliqué par la classe `.theme-admin` sur la racine de l'espace admin (`admin-shell.component`).
Mêmes fonds ; accent `#F2F5F3` (survol `#FFFFFF`), focus blanc. **Aucun vert.** Seules les
couleurs de sens restent (jaune = à surveiller, rouge = en panne). États de santé indiqués par
une icône, un mot **et** une couleur (OK blanc, Dégradé jaune, En panne rouge). Légende des
couleurs toujours visible en haut de « Santé du système » et sous chaque graphique.

## Typographie (auto-hébergée via Fontsource)

- Titres : **Space Grotesk** (600, 700) — `font-display`
- Texte : **Inter** (400, 500) — `font-sans`
- Chiffres, scores, badges, raccourcis : **JetBrains Mono** (500) — `font-mono`

## Formes et mouvement

- Rayons : 12 px cartes (`rounded-card`), 8 px champs/boutons (`rounded-field`), pilules pour
  les badges. Bordures fines plutôt qu'ombres. Grille d'espacement de 4 px.
- Mouvement : 150 ms survols, 250 ms apparitions, courbes douces ; skeletons plutôt que
  spinners ; **tout désactivé** avec `prefers-reduced-motion`.

## Classes utilitaires maison (`styles.css`)

`.jz-btn-primary`, `.jz-btn-ghost`, `.jz-input`, `.jz-label`, `.jz-card`, `.jz-field-error`.

## Responsive et accessibilité

- Mobile d'abord : navigation latérale sur ordinateur, barre en bas sur mobile (`app-shell`).
- Navigation clavier complète, focus visible (anneau vert, blanc en admin), libellés sur tous
  les champs, textes alternatifs.

### Audit Lighthouse (2026-10-27, build de prod, preset mobile)

Mesuré sur un build de production servi avec gzip + cache (comme un hébergeur réel). Objectif
§8 atteint :

| Page | Perf | Accessibilité | Bonnes pratiques | SEO |
| --- | --- | --- | --- | --- |
| `/` (accueil) | 90 | 100 | 100 | 91 |
| `/connexion` | 92 | 100 | 100 | — |

La performance est bornée par le bootstrap de la SPA (render delay du `<h1>` LCP) : la cible est
atteinte, et un prérendu/SSR des pages publiques (option notée pour le déploiement) la ferait
encore grimper.

## Signature « buzz » et clins d'œil

Le « zz » du logo vibre quand il y a des relances à faire (`LogoComponent`, entrée `buzzing`),
avec parcimonie et désactivé en `prefers-reduced-motion`. Vocabulaire : « Buzzer » (relancer),
« Tes buzz du jour ». Ton : tutoiement, phrases courtes, encourageant, jamais culpabilisant.

- **Palette de commandes** `Ctrl/Cmd+K` (`command-palette.component`) : navigation + actions
  principales, tout au clavier.
- **Célébrations** : passage « Entretien » (bandeau vert) et « J'ai trouvé ! » ; message
  encourageant au « Refus ». Toujours sous `prefers-reduced-motion`.
- **Message caché** dans la console du navigateur (`app-shell`).
