import type { NormalizedOffer } from '@jobzz/shared';

/**
 * Jeu d'offres FICTIVES pour le mode démo (CLAUDE.md §4.4). Entreprises au nom clairement inventé.
 * Variété : contrats, villes, métiers, compétences, quelques offres « senior » (pour vérifier le
 * filtre junior) et des alternances. Jamais utilisé comme secours en mode normal.
 */
const CITIES = [
  { label: 'Montpellier', communeCode: '34172', lat: 43.6109, lng: 3.8767 },
  { label: 'Paris', communeCode: '75056', lat: 48.8566, lng: 2.3522 },
  { label: 'Lyon', communeCode: '69123', lat: 45.764, lng: 4.8357 },
  { label: 'Nantes', communeCode: '44109', lat: 47.2184, lng: -1.5536 },
];

interface Template {
  title: string;
  rome: string;
  skills: string[];
  contractType: NormalizedOffer['contractType'];
  senior?: boolean;
}

const TEMPLATES: Template[] = [
  { title: 'Développeur web', rome: 'M1805', skills: ['JavaScript', 'React', 'SQL'], contractType: 'alternance' },
  { title: 'Développeur back-end Java', rome: 'M1805', skills: ['Java', 'Spring', 'SQL'], contractType: 'alternance' },
  { title: 'Développeur front-end', rome: 'M1805', skills: ['TypeScript', 'Angular', 'HTML/CSS'], contractType: 'cdi' },
  { title: 'Data analyst junior', rome: 'M1403', skills: ['Python', 'SQL', 'Excel'], contractType: 'cdi' },
  { title: 'Chargé de communication', rome: 'E1103', skills: ['Réseaux sociaux', 'Rédaction web', 'Canva'], contractType: 'alternance' },
  { title: 'Community manager', rome: 'E1103', skills: ['Réseaux sociaux', 'SEO'], contractType: 'cdd' },
  { title: 'Commercial B2B', rome: 'D1402', skills: ['Prospection', 'Négociation', 'CRM'], contractType: 'cdi' },
  { title: 'Vendeur en magasin', rome: 'D1106', skills: ['Relation client', 'Vente B2C'], contractType: 'alternance' },
  { title: 'Assistant RH', rome: 'M1501', skills: ['Recrutement', 'SIRH'], contractType: 'stage' },
  { title: 'Comptable', rome: 'M1203', skills: ['Comptabilité générale', 'Excel', 'SAGE'], contractType: 'cdi' },
  { title: 'Lead developer', rome: 'M1805', skills: ['Java', 'Docker', 'Kubernetes'], contractType: 'cdi', senior: true },
  { title: 'Directeur marketing', rome: 'M1705', skills: ['Stratégie de contenu'], contractType: 'cdi', senior: true },
  { title: 'UX/UI designer', rome: 'E1205', skills: ['Figma', 'UX design', 'Prototypage'], contractType: 'alternance' },
  { title: 'Chef de projet digital', rome: 'M1806', skills: ['Gestion de projet', 'Agile'], contractType: 'stage' },
];

/** Génère ~40 offres fictives déterministes. */
export function buildDemoOffers(now = new Date()): NormalizedOffer[] {
  const offers: NormalizedOffer[] = [];
  let i = 0;
  // 3 villes par métier → tous les métiers représentés (y compris les offres « senior »).
  for (const tpl of TEMPLATES) {
    for (const city of CITIES.slice(0, 3)) {
      const daysAgo = (i * 2) % 28;
      const publishedAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const remote = i % 4 === 0 ? 'hybride' : i % 7 === 0 ? 'distance' : 'sur_site';
      offers.push({
        source: 'demo',
        externalId: `demo-${i}`,
        url: `https://offres.exemple-jobzz.test/offre/${i}`,
        title: tpl.title,
        companyName: `Entreprise Fictive ${String.fromCharCode(65 + (i % 26))}`,
        siret: null,
        locationLabel: city.label,
        communeCode: city.communeCode,
        lat: city.lat,
        lng: city.lng,
        contractType: tpl.contractType,
        contractNature: tpl.contractType === 'alternance' ? 'apprentissage' : null,
        remote,
        startDate: null,
        startFlexible: tpl.contractType === 'alternance',
        durationMonths: tpl.contractType === 'stage' ? 6 : tpl.contractType === 'alternance' ? 12 : null,
        experienceRequired: tpl.senior ? '5 ans d\'expérience exigés' : 'Débutant accepté',
        salaryText: null,
        skills: tpl.skills,
        romeCodes: [tpl.rome],
        description: `${tpl.title} chez une entreprise fictive à ${city.label}. ${
          tpl.contractType === 'alternance' ? 'Rythme 3 semaines / 1 semaine. ' : ''
        }Compétences : ${tpl.skills.join(', ')}. ${tpl.senior ? 'Poste expérimenté.' : 'Profil junior bienvenu.'}`,
        publishedAt: publishedAt.toISOString(),
        sourceUpdatedAt: publishedAt.toISOString(),
        isDemo: true,
      });
      i += 1;
    }
  }
  return offers;
}
