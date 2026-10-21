import { z } from 'zod';
import { CONTRACT_TYPES, EXPERIENCE_LEVELS, REMOTE_PREFERENCES } from '../constants';
import { jobTargetSchema, profileLocationSchema } from './profile';

/**
 * Critères d'une automatisation (CLAUDE.md §4.6), schéma **versionné** et défini en Zod.
 * Chaque critère « approximatif » peut avoir un mode (obligatoire / préférence / exclusion) et une
 * règle « si l'information est absente de l'offre » (garder / exclure). Les critères obligatoires
 * sont toujours appliqués par le code de façon déterministe ; l'IA ne fait qu'aider à les remplir.
 */

export const AUTOMATION_SCHEMA_VERSION = 1;

export const CRITERION_MODES = ['obligatoire', 'preference', 'exclusion'] as const;
export type CriterionMode = (typeof CRITERION_MODES)[number];

export const MISSING_INFO_RULES = ['garder', 'exclure'] as const;
export type MissingInfoRule = (typeof MISSING_INFO_RULES)[number];

export const REMOTE_CRITERIA = ['indifferent', 'accepte', 'exige', 'hybride_min', 'exclu'] as const;
export type RemoteCriterion = (typeof REMOTE_CRITERIA)[number];

const keywords = z.array(z.string().trim().min(1).max(60)).max(30).default([]);

export const automationCriteriaSchema = z.object({
  schemaVersion: z.literal(AUTOMATION_SCHEMA_VERSION).default(AUTOMATION_SCHEMA_VERSION),

  metiers: z.array(jobTargetSchema).max(10).default([]),
  motsCles: z
    .object({
      inclure: keywords, // au moins un
      indispensables: keywords, // tous
      exclure: keywords, // aucun
    })
    .default({ inclure: [], indispensables: [], exclure: [] }),

  contrats: z.array(z.enum(CONTRACT_TYPES)).max(4).default([]),
  alternanceRythme: z.string().trim().max(120).nullish().transform((v) => v ?? null),
  stageDureeMin: z.number().int().min(1).max(24).nullish().transform((v) => v ?? null),
  stageDureeMax: z.number().int().min(1).max(24).nullish().transform((v) => v ?? null),

  lieux: z.array(profileLocationSchema).max(10).default([]),
  teletravail: z.enum(REMOTE_CRITERIA).default('indifferent'),

  dateDebutDu: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish().transform((v) => v ?? null),
  dateDebutAu: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish().transform((v) => v ?? null),

  experienceMax: z.enum(EXPERIENCE_LEVELS).nullish().transform((v) => v ?? null),

  competences: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(60),
        niveau: z.enum(['indispensable', 'souhaitee']).default('souhaitee'),
      }),
    )
    .max(40)
    .default([]),

  entreprise: z
    .object({
      tailles: z.array(z.enum(['tpe', 'pme', 'eti', 'grand_groupe'])).default([]),
      types: z.array(z.enum(['startup', 'association', 'public'])).default([]),
      secteursInclure: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
      secteursExclure: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
      exclureNoms: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
      exclureEsn: z.boolean().default(false),
    })
    .default({ tailles: [], types: [], secteursInclure: [], secteursExclure: [], exclureNoms: [], exclureEsn: false }),

  salaireMin: z.number().int().min(0).max(500000).nullish().transform((v) => v ?? null),
  fraicheurJours: z.number().int().min(1).max(60).default(14),
  scoreMin: z.number().int().min(0).max(100).default(60),

  /** Préférence télétravail du profil, pour pré-remplir (facultatif). */
  remotePreference: z.enum(REMOTE_PREFERENCES).nullish().transform((v) => v ?? null),
});
export type AutomationCriteria = z.infer<typeof automationCriteriaSchema>;

/** Création / mise à jour d'une automatisation. */
export const automationInputSchema = z.object({
  name: z.string().trim().min(1, 'Donne un nom à ton automatisation').max(120),
  requestText: z.string().trim().max(2000).optional(),
  criteria: automationCriteriaSchema,
});
export type AutomationInput = z.infer<typeof automationInputSchema>;

const CONTRACT_LABELS: Record<string, string> = {
  alternance: 'Alternance',
  stage: 'Stage',
  cdd: 'CDD',
  cdi: 'CDI',
};

/** Résumé en une ligne des critères (CLAUDE.md §4.6). Fonction pure. */
export function summarizeAutomationCriteria(c: AutomationCriteria): string {
  const parts: string[] = [];
  if (c.contrats.length > 0) parts.push(c.contrats.map((t) => CONTRACT_LABELS[t] ?? t).join(' / '));
  if (c.metiers.length > 0) parts.push(c.metiers.map((m) => m.label).join(', '));
  if (c.lieux.length > 0) {
    const l = c.lieux[0];
    parts.push(`${l.label}${l.radiusKm ? ` ${l.radiusKm} km` : ''}`);
  } else if (c.teletravail === 'exige') {
    parts.push('Télétravail');
  }
  if (c.dateDebutDu) parts.push(`dès le ${c.dateDebutDu}`);
  return parts.join(' · ') || 'Tous critères';
}
