import { z } from 'zod';
import { CONTRACT_TYPES, EXPERIENCE_LEVELS, REMOTE_PREFERENCES } from '../constants';

/**
 * Schémas du profil (CLAUDE.md §4.2). Partagés par le back (validation Zod) et le front
 * (Reactive Forms typés). Les champs obligatoires de la recherche — métier(s), contrat(s),
 * ville(s), date de début — sont saisis à l'accueil guidé ; le reste est facultatif.
 */

/** Chaîne facultative : « » devient `null`, sinon trim + borne de longueur. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v.length > 0 ? v : null))
    .nullish()
    .transform((v) => v ?? null);

/** Code ROME : une lettre + 4 chiffres (jamais inventé, vient du référentiel). */
const romeCode = z.string().trim().regex(/^[A-Z]\d{4}$/, 'Code ROME invalide');

/** Métier visé : libellé + codes ROME résolus par le référentiel (vides si saisie libre). */
export const jobTargetSchema = z.object({
  label: z.string().trim().min(1, 'Métier requis').max(120),
  romeCodes: z.array(romeCode).max(10).default([]),
});
export type JobTarget = z.infer<typeof jobTargetSchema>;

/** Zone de recherche : commune (code INSEE) + rayon, ou saisie libre sans code. */
export const profileLocationSchema = z.object({
  communeCode: z.string().trim().max(10).nullish().transform((v) => v ?? null),
  label: z.string().trim().min(1, 'Ville requise').max(120),
  lat: z.number().finite().nullish().transform((v) => v ?? null),
  lng: z.number().finite().nullish().transform((v) => v ?? null),
  radiusKm: z.number().int().min(0).max(200).default(30),
});
export type ProfileLocation = z.infer<typeof profileLocationSchema>;

export const alternanceDetailsSchema = z.object({
  rythme: optionalText(120),
  dureeMois: z.number().int().min(1).max(48).nullish().transform((v) => v ?? null),
  ecole: optionalText(160),
});
export type AlternanceDetails = z.infer<typeof alternanceDetailsSchema>;

export const internshipDetailsSchema = z.object({
  dureeMois: z.number().int().min(1).max(24).nullish().transform((v) => v ?? null),
  periode: optionalText(120),
});
export type InternshipDetails = z.infer<typeof internshipDetailsSchema>;

/** Date de début au format `YYYY-MM-DD` (date seule, sans heure). */
const startDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format AAAA-MM-JJ')
  .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), 'Date invalide');

/**
 * Corps de mise à jour du profil (PUT /profile). Tout est facultatif ici : la contrainte
 * « obligatoire pour la recherche » est portée par l'accueil guidé et la recherche, pas par
 * l'enregistrement du profil (on n'empêche jamais de sauvegarder un profil partiel).
 */
export const profileUpdateSchema = z.object({
  firstName: optionalText(80),
  lastName: optionalText(80),
  phone: optionalText(30),
  linkedinUrl: z
    .string()
    .trim()
    .max(300)
    .transform((v) => (v.length > 0 ? v : null))
    .nullish()
    .transform((v) => v ?? null)
    .refine((v) => v === null || /^https?:\/\//.test(v), 'Lien LinkedIn invalide (http(s)://…)'),
  links: z.array(z.string().trim().url().max(300)).max(10).default([]),

  jobTargets: z.array(jobTargetSchema).max(10).default([]),
  skills: z.array(z.string().trim().min(1).max(60)).max(60).default([]),
  sectors: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  locations: z.array(profileLocationSchema).max(10).default([]),

  remotePreference: z.enum(REMOTE_PREFERENCES).nullish().transform((v) => v ?? null),
  educationLevel: optionalText(80),
  educationField: optionalText(120),
  availableFrom: startDate.nullish().transform((v) => v ?? null),
  contractTypes: z.array(z.enum(CONTRACT_TYPES)).max(4).default([]),
  alternance: alternanceDetailsSchema.nullish().transform((v) => v ?? null),
  internship: internshipDetailsSchema.nullish().transform((v) => v ?? null),
  experienceLevel: z.enum(EXPERIENCE_LEVELS).nullish().transform((v) => v ?? null),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

/** Ajout de compétences au profil (ex. depuis le CV), sans toucher aux autres champs. */
export const addSkillsSchema = z.object({
  skills: z.array(z.string().trim().min(1).max(60)).max(60),
});
export type AddSkillsInput = z.infer<typeof addSkillsSchema>;
