/**
 * Matrice de faisabilité des critères d'automatisation (CLAUDE.md §4.6). Sert à la fois au code
 * (comment appliquer chaque critère) et à l'IA / l'UI (ce qu'on peut promettre honnêtement).
 * Fichier de données facile à compléter.
 */
export type Reliability = 'fiable' | 'approximatif' | 'impossible';

export interface CapabilityEntry {
  /** Clé du critère (alignée sur AutomationCriteria quand c'est applicable). */
  key: string;
  label: string;
  reliability: Reliability;
  /** Explication courte, honnête, affichable à l'utilisateur. */
  note: string;
}

export const AUTOMATION_CAPABILITIES: CapabilityEntry[] = [
  { key: 'metiers', label: 'Métier', reliability: 'fiable', note: 'Recherché par code ROME / mots-clés sur la source.' },
  { key: 'lieux', label: 'Lieu et rayon', reliability: 'fiable', note: 'Paramètre de la source + calcul de distance.' },
  { key: 'contrats', label: 'Type de contrat', reliability: 'fiable', note: 'Paramètre de la source (type et nature de contrat).' },
  { key: 'fraicheurJours', label: 'Fraîcheur de publication', reliability: 'fiable', note: 'Date de création de l\'offre.' },
  { key: 'experienceMax', label: 'Expérience exigée', reliability: 'fiable', note: 'Fiable si le champ est renseigné (sinon détecté dans le texte).' },
  { key: 'motsCles', label: 'Mots-clés inclus / exclus', reliability: 'fiable', note: 'Recherche dans le titre et la description.' },
  { key: 'entreprise.exclureNoms', label: 'Entreprise précise exclue', reliability: 'fiable', note: 'Nom normalisé (certaines offres n\'indiquent pas l\'entreprise).' },
  { key: 'competences', label: 'Compétences', reliability: 'approximatif', note: 'Champs structurés + dictionnaire + familles (+ IA en Premium).' },
  { key: 'teletravail', label: 'Télétravail', reliability: 'approximatif', note: 'Champ structuré (alternance) ou détecté dans le texte.' },
  { key: 'dateDebut', label: 'Date de début / durée', reliability: 'approximatif', note: 'Champs structurés (alternance) ou détecté dans le texte.' },
  { key: 'alternanceRythme', label: 'Rythme d\'alternance', reliability: 'approximatif', note: 'Détecté dans le texte ; jamais éliminatoire.' },
  { key: 'entreprise.tailles', label: 'Taille / catégorie d\'entreprise', reliability: 'approximatif', note: 'Tranche d\'effectif via l\'API Recherche d\'entreprises.' },
  { key: 'entreprise.exclureEsn', label: 'Exclure les ESN', reliability: 'approximatif', note: 'Code NAF conseil informatique + mots-clés (+ IA).' },
  { key: 'entreprise.types', label: 'Startup', reliability: 'approximatif', note: 'Pas de définition officielle : < 8 ans, < 250 salariés, secteur innovant.' },
  { key: 'entreprise.secteurs', label: 'Secteur', reliability: 'approximatif', note: 'Code NAF + mots-clés (+ IA).' },
  { key: 'salaireMin', label: 'Salaire minimum', reliability: 'approximatif', note: 'Rarement renseigné ; par défaut, on garde les offres sans salaire.' },
  { key: 'ambiance', label: 'Ambiance, valeurs, management', reliability: 'impossible', note: 'Impossible à vérifier de façon fiable.' },
  { key: 'garantie_embauche', label: 'Garantie d\'embauche après l\'alternance', reliability: 'impossible', note: 'Impossible à garantir.' },
  { key: 'autres_sites', label: 'Offres Indeed / LinkedIn / WTTJ…', reliability: 'impossible', note: 'Pas d\'API publique : on t\'aide plutôt à régler des alertes sur ces sites.' },
  { key: 'contact_recruteur', label: 'Contact / email du recruteur', reliability: 'impossible', note: 'Hors périmètre (vie privée).' },
];

export function capabilitiesByReliability(reliability: Reliability): CapabilityEntry[] {
  return AUTOMATION_CAPABILITIES.filter((c) => c.reliability === reliability);
}
