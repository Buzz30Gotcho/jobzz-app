import type { ProfileUpdateInput } from './schemas/profile';

/**
 * Complétude du profil (CLAUDE.md §4.2) : un pourcentage et des **pastilles neutres**
 * (jamais rouges, jamais d'alerte) listant seulement ce qui **améliore les offres**.
 * Fonction pure, testée, utilisée côté serveur et affichée uniquement sur la page Profil.
 */

export interface ProfileCompletionItem {
  /** Clé stable (sert d'ancre vers le champ concerné côté front). */
  key: string;
  label: string;
  done: boolean;
}

export interface ProfileCompletion {
  percent: number;
  items: ProfileCompletionItem[];
}

/** Données minimales nécessaires au calcul (profil + présence d'un CV, ajouté à l'étape 7). */
export type ProfileCompletionInput = Pick<
  ProfileUpdateInput,
  'jobTargets' | 'contractTypes' | 'locations' | 'availableFrom' | 'skills' | 'sectors' | 'linkedinUrl' | 'remotePreference'
> & { hasCv?: boolean };

export function computeProfileCompletion(profile: ProfileCompletionInput): ProfileCompletion {
  const items: ProfileCompletionItem[] = [
    { key: 'jobTargets', label: 'Métier visé', done: (profile.jobTargets ?? []).length > 0 },
    { key: 'contractTypes', label: 'Type de contrat', done: (profile.contractTypes ?? []).length > 0 },
    { key: 'locations', label: 'Lieu de recherche', done: (profile.locations ?? []).length > 0 },
    { key: 'availableFrom', label: 'Date de début', done: Boolean(profile.availableFrom) },
    { key: 'skills', label: 'Compétences', done: (profile.skills ?? []).length > 0 },
    { key: 'cv', label: 'CV déposé', done: Boolean(profile.hasCv) },
    { key: 'linkedinUrl', label: 'Lien LinkedIn', done: Boolean(profile.linkedinUrl) },
    { key: 'remotePreference', label: 'Préférence télétravail', done: Boolean(profile.remotePreference) },
    { key: 'sectors', label: 'Secteurs', done: (profile.sectors ?? []).length > 0 },
  ];

  const done = items.filter((i) => i.done).length;
  const percent = Math.round((done / items.length) * 100);
  return { percent, items };
}
