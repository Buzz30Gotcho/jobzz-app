import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import {
  analyzeCvByRules,
  compareCvToOffer,
  cvAiAnalysisSchema,
  cvExtractSchema,
  cvOfferAiAdviceSchema,
  extractSkillsFromCv,
  jobKeywordsFromLabels,
  type CvOfferComparison,
  type CvOfferComparisonResult,
  type CvProfileExtract,
  type CvRulesAnalysis,
  type CvStatus,
  type JobTarget,
  AI,
  FILES,
} from '@jobzz/shared';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService, type EntitlementSubject } from '../entitlements/entitlements.service';
import { AiService, AiUnavailableError } from '../ai/ai.service';
import {
  CV_ANALYSIS_SYSTEM,
  CV_EXTRACT_SYSTEM,
  CV_OFFER_SYSTEM,
  buildCvAnalysisPrompt,
  buildCvExtractPrompt,
  buildCvOfferPrompt,
} from '../ai/prompts/cv';
import { extractPdfText, looksLikePdf } from './pdf-text';

@Injectable()
export class CvService {
  private readonly logger = new Logger(CvService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    private readonly ai: AiService,
  ) {}

  /** État courant du CV (métadonnées + dernière analyse par règles). */
  async status(userId: string): Promise<CvStatus> {
    const doc = await this.prisma.cvDocument.findUnique({ where: { userId } });
    if (!doc) return { hasCv: false, uploadedAt: null, rules: null, ai: null };
    const analysis = await this.prisma.cvAnalysis.findFirst({
      where: { userId, fileHash: doc.fileHash },
      orderBy: { createdAt: 'desc' },
    });
    return {
      hasCv: true,
      uploadedAt: doc.uploadedAt.toISOString(),
      rules: (analysis?.rulesResult as CvRulesAnalysis | undefined) ?? null,
      ai: (analysis?.aiResult as unknown as CvStatus['ai']) ?? null,
    };
  }

  /**
   * Dépose un CV : vérifie le type réel et la taille, extrait le texte, supprime le fichier (il
   * n'est jamais écrit sur disque — multer le garde en mémoire), stocke le texte et lance l'analyse
   * par règles. Le fichier d'origine n'est jamais conservé (CLAUDE.md §4.8, §9).
   */
  async upload(subject: EntitlementSubject, file: Express.Multer.File): Promise<CvStatus> {
    if (!file) throw new BadRequestException('Aucun fichier reçu.');
    if (file.size > FILES.cvMaxBytes) {
      throw new BadRequestException('CV trop volumineux (5 Mo maximum).');
    }
    if (!looksLikePdf(file.buffer)) {
      throw new BadRequestException('Le fichier doit être un PDF.');
    }

    let text: string;
    try {
      text = await extractPdfText(file.buffer);
    } catch {
      throw new BadRequestException('Impossible de lire ce PDF. Essaie un autre fichier.');
    }
    if (text.length < 30) {
      throw new BadRequestException(
        'Ce PDF ne contient pas de texte (peut-être une image scannée). Dépose un PDF avec du texte.',
      );
    }

    const fileHash = createHash('sha256').update(file.buffer).digest('hex');

    // Un seul CV actif : le nouveau remplace l'ancien.
    await this.prisma.cvDocument.upsert({
      where: { userId: subject.id },
      create: { userId: subject.id, extractedText: text, fileHash },
      update: { extractedText: text, fileHash, uploadedAt: new Date() },
    });

    await this.runRulesAnalysis(subject, fileHash, text);
    return this.status(subject.id);
  }

  /** (Re)lance l'analyse par règles si le droit le permet ; sinon, laisse le CV sans analyse. */
  private async runRulesAnalysis(
    subject: EntitlementSubject,
    fileHash: string,
    text: string,
  ): Promise<void> {
    // Déjà analysé pour ce fichier : on ne reconsomme pas le droit.
    const existing = await this.prisma.cvAnalysis.findFirst({
      where: { userId: subject.id, fileHash },
    });
    if (existing) return;

    try {
      await this.entitlements.consume('cv_rules_analysis', subject);
    } catch (err) {
      if (err instanceof ForbiddenException) {
        this.logger.log(`Analyse CV par règles non consommée pour ${subject.id} : limite atteinte.`);
        return; // le CV reste déposé (utile pour la comparaison), simplement pas d'analyse ce mois-ci
      }
      throw err;
    }

    const jobKeywords = await this.jobKeywords(subject.id);
    const rules = analyzeCvByRules(text, jobKeywords);
    await this.prisma.cvAnalysis.create({
      data: { userId: subject.id, fileHash, rulesResult: rules as object },
    });
  }

  /**
   * Compare le CV à une offre, par règles (CLAUDE.md §4.8). Résultat mis en cache par
   * (utilisateur + offre + empreinte du CV). Lève `NO_CV` si l'utilisateur n'a pas de CV.
   */
  async compare(subject: EntitlementSubject, offerId: string): Promise<CvOfferComparisonResult> {
    const doc = await this.prisma.cvDocument.findUnique({ where: { userId: subject.id } });
    if (!doc) throw new BadRequestException('NO_CV');

    const offer = await this.prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer) throw new NotFoundException('Offre introuvable.');

    const cached = await this.prisma.cvOfferComparison.findUnique({
      where: {
        userId_offerId_fileHash: { userId: subject.id, offerId, fileHash: doc.fileHash },
      },
    });
    if (cached) {
      return {
        rules: cached.rulesResult as unknown as CvOfferComparison,
        ai: (cached.aiResult as unknown as CvOfferComparisonResult['ai']) ?? null,
      };
    }

    // Une comparaison par règles est consommée (gratuit : 1 par jour).
    await this.entitlements.consume('cv_offer_comparison', subject);

    const profile = await this.prisma.profile.findUnique({ where: { userId: subject.id } });
    const profileSkills = (profile?.skills as string[] | undefined) ?? [];
    const rules = compareCvToOffer(
      doc.extractedText,
      { title: offer.title, skills: (offer.skills as string[] | undefined) ?? [] },
      profileSkills,
    );

    await this.prisma.cvOfferComparison.create({
      data: { userId: subject.id, offerId, fileHash: doc.fileHash, rulesResult: rules as object },
    });
    return { rules, ai: null };
  }

  /**
   * Analyse du CV par l'IA (Premium, CLAUDE.md §4.8). Repli : si l'IA est indisponible, on lève
   * `ServiceUnavailableException('AI_UNAVAILABLE')` — l'analyse par règles reste, elle, disponible.
   */
  async analyzeAi(subject: EntitlementSubject): Promise<CvStatus> {
    const doc = await this.prisma.cvDocument.findUnique({ where: { userId: subject.id } });
    if (!doc) throw new BadRequestException('NO_CV');

    const allowance = await this.entitlements.can('cv_ai_analysis', subject);
    if (!allowance.allowed) throw new ForbiddenException('Analyse IA réservée au Premium.');

    const jobLabel = await this.jobLabel(subject.id);
    try {
      const result = await this.ai.generateJson({
        feature: 'cv_analysis',
        system: CV_ANALYSIS_SYSTEM,
        prompt: buildCvAnalysisPrompt(doc.extractedText, jobLabel),
        schema: cvAiAnalysisSchema,
        timeoutMs: AI.cvTimeoutMs,
        cacheKey: `cv_ai_${doc.fileHash}`,
      });
      await this.entitlements.consume('cv_ai_analysis', subject);

      // On range le résultat IA sur la ligne d'analyse de ce CV (créée au dépôt si elle manque).
      const existing = await this.prisma.cvAnalysis.findFirst({
        where: { userId: subject.id, fileHash: doc.fileHash },
      });
      if (existing) {
        await this.prisma.cvAnalysis.update({
          where: { id: existing.id },
          data: { aiResult: result as object },
        });
      } else {
        const rules = analyzeCvByRules(doc.extractedText, await this.jobKeywords(subject.id));
        await this.prisma.cvAnalysis.create({
          data: {
            userId: subject.id,
            fileHash: doc.fileHash,
            rulesResult: rules as object,
            aiResult: result as object,
          },
        });
      }
      return this.status(subject.id);
    } catch (err) {
      if (err instanceof AiUnavailableError) throw new ServiceUnavailableException('AI_UNAVAILABLE');
      throw err;
    }
  }

  /**
   * Conseils IA pour adapter le CV à une offre (Premium, CLAUDE.md §4.8). S'appuie sur la
   * comparaison par règles (créée/consommée au besoin), puis ajoute le bloc IA. Repli identique.
   */
  async compareAi(subject: EntitlementSubject, offerId: string): Promise<CvOfferComparisonResult> {
    const base = await this.compare(subject, offerId); // garantit la comparaison par règles (+ cache)
    if (base.ai) return base; // conseils IA déjà en cache

    const allowance = await this.entitlements.can('cv_offer_ai_advice', subject);
    if (!allowance.allowed) throw new ForbiddenException('Conseils IA réservés au Premium.');

    const doc = await this.prisma.cvDocument.findUnique({ where: { userId: subject.id } });
    const offer = await this.prisma.offer.findUnique({ where: { id: offerId } });
    if (!doc || !offer) throw new NotFoundException('Données introuvables.');

    try {
      const result = await this.ai.generateJson({
        feature: 'cv_offer_advice',
        system: CV_OFFER_SYSTEM,
        prompt: buildCvOfferPrompt(doc.extractedText, offer.title, offer.description),
        schema: cvOfferAiAdviceSchema,
        timeoutMs: AI.cvTimeoutMs,
        cacheKey: `cv_offer_ai_${doc.fileHash}_${offerId}`,
      });
      await this.entitlements.consume('cv_offer_ai_advice', subject);
      await this.prisma.cvOfferComparison.update({
        where: {
          userId_offerId_fileHash: { userId: subject.id, offerId, fileHash: doc.fileHash },
        },
        data: { aiResult: result as object },
      });
      return { ...base, ai: result };
    } catch (err) {
      if (err instanceof AiUnavailableError) throw new ServiceUnavailableException('AI_UNAVAILABLE');
      throw err;
    }
  }

  /**
   * Extrait des suggestions de profil depuis le CV (CLAUDE.md §4.8), à valider par l'utilisateur.
   * Compétences par règles toujours ; l'IA (si disponible) ajoute métier, ville, niveau d'études
   * et des compétences supplémentaires. Jamais bloquant : sans IA, on renvoie les règles seules.
   */
  async extractProfile(subject: EntitlementSubject): Promise<CvProfileExtract> {
    const doc = await this.prisma.cvDocument.findUnique({ where: { userId: subject.id } });
    if (!doc) throw new BadRequestException('NO_CV');

    const ruleSkills = extractSkillsFromCv(doc.extractedText);
    const result: CvProfileExtract = {
      skills: ruleSkills,
      jobLabel: null,
      city: null,
      educationLevel: null,
      aiUsed: false,
    };

    try {
      const ai = await this.ai.generateJson({
        feature: 'cv_extract',
        system: CV_EXTRACT_SYSTEM,
        prompt: buildCvExtractPrompt(doc.extractedText),
        schema: cvExtractSchema,
        timeoutMs: AI.cvTimeoutMs,
        cacheKey: `cv_extract_${doc.fileHash}`,
      });
      // Fusion dédupliquée (insensible à la casse) des compétences règles + IA.
      const merged = [...ruleSkills];
      for (const s of ai.skills ?? []) {
        if (!merged.some((m) => m.toLowerCase() === s.toLowerCase())) merged.push(s);
      }
      result.skills = merged.slice(0, 20);
      result.jobLabel = ai.jobLabel ?? null;
      result.city = ai.city ?? null;
      result.educationLevel = ai.educationLevel ?? null;
      result.aiUsed = true;
    } catch (err) {
      if (!(err instanceof AiUnavailableError)) throw err;
      // IA indisponible : on garde l'extraction par règles.
    }
    return result;
  }

  /** Libellé du premier métier visé du profil (pour contextualiser l'IA). */
  private async jobLabel(userId: string): Promise<string | undefined> {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    const targets = (profile?.jobTargets as JobTarget[] | undefined) ?? [];
    return targets[0]?.label;
  }

  /** Supprime le CV et toutes ses analyses et comparaisons (CLAUDE.md §4.8, §4.12). */
  async remove(userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.cvOfferComparison.deleteMany({ where: { userId } }),
      this.prisma.cvAnalysis.deleteMany({ where: { userId } }),
      this.prisma.cvDocument.deleteMany({ where: { userId } }),
    ]);
  }

  /** Mots-clés du métier visé, depuis le profil (pour l'analyse par règles). */
  private async jobKeywords(userId: string): Promise<string[]> {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    const targets = (profile?.jobTargets as JobTarget[] | undefined) ?? [];
    return jobKeywordsFromLabels(targets.map((t) => t.label));
  }
}
