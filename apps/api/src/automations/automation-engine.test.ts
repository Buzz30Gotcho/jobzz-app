import { describe, expect, it } from 'vitest';
import { automationCriteriaSchema, type NormalizedOffer } from '@jobzz/shared';
import { previsionParSemaine, runAutomation } from './automation-engine';

function offer(partial: Partial<NormalizedOffer>): NormalizedOffer {
  return {
    source: 'demo', externalId: Math.random().toString(), url: '', title: 'Développeur web',
    companyName: 'Acme', siret: null, locationLabel: 'Montpellier', communeCode: '34172',
    lat: 43.61, lng: 3.87, contractType: 'alternance', contractNature: null, remote: null,
    startDate: null, startFlexible: true, durationMonths: 12, experienceRequired: 'Débutant accepté',
    salaryText: null, skills: ['React', 'SQL'], romeCodes: ['M1805'], description: 'Stack React et SQL',
    publishedAt: new Date().toISOString(), sourceUpdatedAt: null, isDemo: true, ...partial,
  };
}

const criteria = automationCriteriaSchema.parse({
  metiers: [{ label: 'Développeur web', romeCodes: ['M1805'] }],
  contrats: ['alternance'],
  lieux: [{ label: 'Montpellier', communeCode: '34172', lat: 43.61, lng: 3.87, radiusKm: 30 }],
  competences: [{ label: 'React', niveau: 'souhaitee' }],
  scoreMin: 40,
});

describe('runAutomation', () => {
  it('garde une offre qui correspond et remplit l\'entonnoir', () => {
    const r = runAutomation([offer({})], criteria);
    expect(r.funnel.trouvees).toBe(1);
    expect(r.funnel.apresMetierLieu).toBe(1);
    expect(r.kept.length).toBe(1);
    expect(r.kept[0].score.score).toBeGreaterThanOrEqual(40);
  });

  it('écarte un autre métier (hors domaine ROME et mots-clés)', () => {
    const r = runAutomation([offer({ title: 'Infirmier', romeCodes: ['J1506'], description: 'soins' })], criteria);
    expect(r.funnel.apresMetierLieu).toBe(0);
  });

  it('écarte une offre trop loin du lieu', () => {
    const r = runAutomation([offer({ lat: 48.85, lng: 2.35, locationLabel: 'Paris' })], criteria);
    expect(r.funnel.apresMetierLieu).toBe(0);
  });

  it('écarte une offre senior via le filtre junior', () => {
    const r = runAutomation([offer({ title: 'Développeur senior', experienceRequired: '5 ans exigés' })], criteria);
    expect(r.funnel.apresContratDateJunior).toBe(0);
  });

  it('respecte les mots-clés à exclure', () => {
    const c = automationCriteriaSchema.parse({ ...criteria, motsCles: { inclure: [], indispensables: [], exclure: ['régie'] } });
    const r = runAutomation([offer({ description: 'mission en régie chez le client' })], c);
    expect(r.funnel.apresContratDateJunior).toBe(0);
  });

  it('exclut une entreprise nommée', () => {
    const c = automationCriteriaSchema.parse({ ...criteria, entreprise: { exclureNoms: ['Acme'] } });
    const r = runAutomation([offer({ companyName: 'ACME SAS' })], c);
    expect(r.funnel.apresContratDateJunior).toBe(0);
  });
});

describe('previsionParSemaine', () => {
  it('divise par 2 et arrondit', () => {
    expect(previsionParSemaine(6)).toBe(3);
    expect(previsionParSemaine(5)).toBe(3);
    expect(previsionParSemaine(0)).toBe(0);
  });
});
