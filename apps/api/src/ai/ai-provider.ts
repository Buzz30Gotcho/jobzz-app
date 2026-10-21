/**
 * Abstraction du fournisseur d'IA (CLAUDE.md §5). L'implémentation par défaut est Ollama ; une
 * implémentation en ligne pourra être ajoutée plus tard sans toucher au reste du code.
 *
 * Le fournisseur ne fait que **produire du texte** : il ne déclenche aucune action. Les sorties
 * structurées sont ensuite validées par Zod au niveau du service.
 */
export interface AiGenerateOptions {
  /** Consigne système (rôle, règles de sécurité, format attendu). */
  system?: string;
  /** Délai maximum avant abandon (ms). */
  timeoutMs: number;
  /** Température (0 = déterministe). */
  temperature?: number;
}

export interface AiProvider {
  /** Nom du modèle utilisé (pour le journal). */
  readonly model: string;
  /** Le fournisseur est-il activé et configuré ? */
  isAvailable(): boolean;
  /** Génère du texte libre. */
  generateText(prompt: string, options: AiGenerateOptions): Promise<string>;
  /** Génère une sortie JSON (chaîne à parser/valider par l'appelant). */
  generateJson(prompt: string, options: AiGenerateOptions): Promise<unknown>;
}

/** Jeton d'injection NestJS pour le fournisseur d'IA. */
export const AI_PROVIDER = Symbol('AI_PROVIDER');
