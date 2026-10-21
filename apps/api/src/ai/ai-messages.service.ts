import { ForbiddenException, Injectable } from '@nestjs/common';
import { AI, renderMessage, type PublicProfile, type TemplateVars } from '@jobzz/shared';
import { EntitlementsService, type EntitlementSubject } from '../entitlements/entitlements.service';
import { ProfileService } from '../profile/profile.service';
import { AiService, AiUnavailableError } from './ai.service';
import { aiMessageSchema, buildMessagePrompt, MESSAGE_SYSTEM_PROMPT, type MessageContext } from './prompts/message';

export interface GeneratedMessage {
  subject: string;
  body: string;
  /** Vrai si l'IA a rédigé le message ; faux si on est retombé sur le modèle. */
  aiGenerated: boolean;
}

/**
 * Génère un message (relance / envoi libre) par l'IA (Premium), avec **repli** sur le modèle si
 * l'IA est indisponible (CLAUDE.md §4.3, §5). La limite `ai_message` n'est consommée qu'en cas de
 * succès de l'IA ; le repli par modèle reste gratuit et toujours disponible.
 */
@Injectable()
export class AiMessagesService {
  constructor(
    private readonly ai: AiService,
    private readonly entitlements: EntitlementsService,
    private readonly profile: ProfileService,
  ) {}

  async generate(
    subject: EntitlementSubject,
    ctx: MessageContext,
  ): Promise<GeneratedMessage> {
    // Droit d'utiliser l'IA (Premium). Lève ForbiddenException sinon.
    const allowance = await this.entitlements.can('ai_message', subject);
    if (!allowance.allowed) {
      throw new ForbiddenException('Fonctionnalité réservée au Premium.');
    }

    const profile = await this.profile.get(subject.id);
    const vars = this.vars(ctx, profile);

    try {
      const result = await this.ai.generateJson({
        feature: `message_${ctx.kind}`,
        system: MESSAGE_SYSTEM_PROMPT,
        prompt: buildMessagePrompt({ ...ctx, prenom: ctx.prenom ?? profile.firstName ?? undefined }),
        schema: aiMessageSchema,
        timeoutMs: AI.messageTimeoutMs,
      });
      await this.entitlements.consume('ai_message', subject);
      // On ajoute la signature de l'utilisateur au message IA (jamais inventée par l'IA).
      const signature = this.signature(profile);
      const body = signature ? `${result.body}\n\n${signature}` : result.body;
      return { subject: result.subject, body, aiGenerated: true };
    } catch (err) {
      if (err instanceof AiUnavailableError) {
        const fallback = renderMessage(ctx.kind, vars);
        return { subject: fallback.subject, body: fallback.body, aiGenerated: false };
      }
      throw err;
    }
  }

  private vars(ctx: MessageContext, profile: PublicProfile): TemplateVars {
    return {
      entreprise: ctx.entreprise,
      poste: ctx.poste,
      date_candidature: ctx.dateCandidature,
      prenom: profile.firstName ?? '',
      signature: this.signature(profile),
    };
  }

  private signature(profile: PublicProfile): string {
    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
    return [fullName, profile.phone, profile.linkedinUrl].filter(Boolean).join('\n');
  }
}
