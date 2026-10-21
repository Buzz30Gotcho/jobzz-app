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
  les champs, textes alternatifs. Objectif Lighthouse ≥ 90.

## Signature « buzz »

Le « zz » du logo vibre quand il y a des relances à faire (`LogoComponent`, entrée `buzzing`),
avec parcimonie et désactivé en `prefers-reduced-motion`. Vocabulaire : « Buzzer » (relancer),
« Tes buzz du jour ». Ton : tutoiement, phrases courtes, encourageant, jamais culpabilisant.
