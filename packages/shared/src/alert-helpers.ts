/**
 * Aide aux alertes sur les autres sites (CLAUDE.md §4.6). Jobzz ne lit rien chez eux : il prépare
 * un texte de recherche et un lien, l'utilisateur crée l'alerte lui-même. Génération **par règles**
 * (pas d'IA), testée. Les modèles de liens et la syntaxe de chaque site sont **isolés ici**
 * (notés « à vérifier » dans docs/DECISIONS.md) ; le texte à copier est toujours affiché, pour
 * fonctionner même si un lien casse.
 */

export interface AlertSpec {
  /** Appellations du métier (la première est la principale). */
  metiers: string[];
  /** Mot du contrat (« alternance », « stage », « CDI », « CDD »), facultatif. */
  contractWord?: string;
  /** Mots à exclure (juniors + exclusions de l'automatisation). */
  excludeWords: string[];
  locationLabel?: string;
  radiusKm?: number;
}

export interface AlertSite {
  id: string;
  label: string;
  /** Le site comprend-il les opérateurs (guillemets, OR, -) ? */
  supportsOperators: boolean;
  /** Construit l'URL de recherche pré-remplie. */
  buildUrl: (query: string, spec: AlertSpec) => string;
  help: string;
}

export interface AlertSuggestion {
  site: string;
  label: string;
  query: string;
  url: string;
  filters: string[];
  help: string;
}

/** Mots d'exclusion junior par défaut (jamais « manager » ni « responsable »). */
export const JUNIOR_EXCLUDE_WORDS = ['senior', 'confirmé', 'expérimenté', 'lead', 'head of', 'directeur'];

const enc = encodeURIComponent;

/** Liste des sites (facile à compléter). À VÉRIFIER : modèles d'URL et syntaxe. */
export const ALERT_SITES: AlertSite[] = [
  {
    id: 'indeed',
    label: 'Indeed',
    supportsOperators: true,
    buildUrl: (q, s) =>
      `https://fr.indeed.com/jobs?q=${enc(q)}${s.locationLabel ? `&l=${enc(s.locationLabel)}` : ''}${
        s.radiusKm ? `&radius=${s.radiusKm}` : ''
      }`,
    help: 'Clique ensuite sur « Créer une alerte » en bas des résultats.',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    supportsOperators: false,
    buildUrl: (q, s) =>
      `https://www.linkedin.com/jobs/search/?keywords=${enc(q)}${s.locationLabel ? `&location=${enc(s.locationLabel)}` : ''}`,
    help: 'Active la cloche « Créer une alerte » en haut des résultats.',
  },
  {
    id: 'wttj',
    label: 'Welcome to the Jungle',
    supportsOperators: false,
    buildUrl: (q, s) =>
      `https://www.welcometothejungle.com/fr/jobs?query=${enc(q)}${s.locationLabel ? `&aroundQuery=${enc(s.locationLabel)}` : ''}`,
    help: 'Crée une alerte depuis la page de résultats.',
  },
  {
    id: 'hellowork',
    label: 'HelloWork',
    supportsOperators: false,
    buildUrl: (q, s) =>
      `https://www.hellowork.com/fr-fr/emploi/recherche.html?k=${enc(q)}${s.locationLabel ? `&l=${enc(s.locationLabel)}` : ''}`,
    help: 'Enregistre la recherche pour recevoir les alertes.',
  },
  {
    id: 'apec',
    label: 'APEC',
    supportsOperators: false,
    buildUrl: (q) => `https://www.apec.fr/candidat/recherche-emploi.html/emploi?motsCles=${enc(q)}`,
    help: 'Crée une alerte (jeunes diplômés) depuis les résultats.',
  },
];

/** Construit le texte de recherche adapté à un site. Fonction pure. */
export function buildAlertQuery(spec: AlertSpec, supportsOperators: boolean): string {
  const metiers = spec.metiers.filter((m) => m.trim().length > 0);
  const parts: string[] = [];

  if (spec.contractWord) parts.push(spec.contractWord);

  if (supportsOperators) {
    // Guillemets + OR pour les appellations, puis -exclusions.
    if (metiers.length > 0) {
      parts.push(`(${metiers.map((m) => `"${m}"`).join(' OR ')})`);
    }
    for (const w of spec.excludeWords) parts.push(`-${w.includes(' ') ? `"${w}"` : w}`);
  } else {
    // Simple liste de mots-clés (pas d'opérateurs).
    if (metiers.length > 0) parts.push(metiers[0]);
  }

  return parts.join(' ').trim();
}

/** Génère une suggestion d'alerte par site à partir d'une spec. */
export function generateAlertHelpers(spec: AlertSpec): AlertSuggestion[] {
  return ALERT_SITES.map((site) => {
    const query = buildAlertQuery(spec, site.supportsOperators);
    const filters: string[] = [];
    if (spec.locationLabel) {
      filters.push(`Lieu : ${spec.locationLabel}${spec.radiusKm ? ` (${spec.radiusKm} km)` : ''}`);
    }
    if (spec.contractWord) filters.push(`Contrat : ${spec.contractWord}`);
    filters.push('Niveau : débutant / junior');
    return { site: site.id, label: site.label, query, url: site.buildUrl(query, spec), filters, help: site.help };
  });
}
