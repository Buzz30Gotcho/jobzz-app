import { describe, expect, it } from 'vitest';
import { compareCvToOffer } from './cv-offer-comparison';

const CV = `
Développeur web junior.
Compétences : JavaScript, React, SQL.
Expérience en intégration et tests.
`;

describe('compareCvToOffer', () => {
  it('classe chaque compétence : présente / dans le profil mais absente du CV / absente', () => {
    const offer = { title: 'Développeur', skills: ['React', 'Docker', 'Node'] };
    // Docker : directement dans le profil ; Node : même famille que JavaScript (profil), pas dans le CV.
    const profileSkills = ['Docker', 'JavaScript'];
    const r = compareCvToOffer(CV, offer, profileSkills);

    const bySkill = Object.fromEntries(r.skills.map((s) => [s.skill, s.presence]));
    expect(bySkill['React']).toBe('in_cv');
    expect(bySkill['Docker']).toBe('in_profile_not_cv');
    expect(bySkill['Node']).toBe('in_profile_not_cv');
  });

  it('marque « absente » une compétence ni dans le CV ni dans le profil', () => {
    const offer = { title: 'Dev', skills: ['Kubernetes'] };
    const r = compareCvToOffer(CV, offer, []);
    expect(r.skills[0].presence).toBe('absent');
  });

  it('liste les mots-clés du titre absents du CV, sans les mots vides', () => {
    const offer = { title: 'Alternance Data Analyst junior', skills: [] };
    const r = compareCvToOffer(CV, offer, []);
    expect(r.missingKeywords).toContain('data');
    expect(r.missingKeywords).toContain('analyst');
    expect(r.missingKeywords).not.toContain('alternance'); // mot vide
    expect(r.missingKeywords).not.toContain('junior');
  });

  it('génère des conseils concrets, priorité au profil non reporté sur le CV', () => {
    const offer = { title: 'Développeur', skills: ['Docker', 'Kubernetes'] };
    const r = compareCvToOffer(CV, offer, ['Docker']);
    expect(r.advice.length).toBeGreaterThan(0);
    expect(r.advice.length).toBeLessThanOrEqual(3);
    expect(r.advice[0]).toContain('Docker');
  });

  it('ne plante pas si l’offre ne liste aucune compétence', () => {
    const offer = { title: 'Chargé de communication', skills: [] };
    const r = compareCvToOffer(CV, offer, []);
    expect(r.skills).toEqual([]);
    expect(r.missingKeywords).toContain('charge');
  });
});
