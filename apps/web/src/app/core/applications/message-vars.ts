import type { PublicApplication, PublicProfile, TemplateVars } from '@jobzz/shared';

/** Signature générée depuis le profil (nom, téléphone, LinkedIn) — CLAUDE.md §4.2. */
export function buildSignature(profile: PublicProfile | null): string {
  if (!profile) return '';
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
  return [fullName, profile.phone, profile.linkedinUrl].filter(Boolean).join('\n');
}

/** Variables d'un modèle de message pour une candidature donnée. */
export function buildMessageVars(app: PublicApplication, profile: PublicProfile | null): TemplateVars {
  return {
    entreprise: app.companyName,
    poste: app.position,
    date_candidature: new Date(app.appliedAt).toLocaleDateString('fr-FR'),
    prenom: profile?.firstName ?? '',
    signature: buildSignature(profile),
  };
}
