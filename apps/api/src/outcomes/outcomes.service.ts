import { Injectable, NotFoundException } from '@nestjs/common';
import type { JobOutcome } from '@prisma/client';
import type {
  CreateJobOutcomeInput,
  Helpfulness,
  PublicJobOutcome,
} from '@jobzz/shared';
import { PrismaService } from '../prisma/prisma.service';

/** « J'ai trouvé ! » (CLAUDE.md §4.9). Preuve de valeur de Jobzz, alimente les stats admin. */
@Injectable()
export class OutcomesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, input: CreateJobOutcomeInput): Promise<PublicJobOutcome> {
    const outcome = await this.prisma.jobOutcome.create({
      data: {
        userId,
        contractType: input.contractType,
        companyName: input.companyName ?? null,
        helpfulness: input.helpfulness ?? null,
        comment: input.comment ?? null,
      },
    });
    return this.toPublic(outcome);
  }

  /** « Finalement, je cherche encore » : annule l'événement (sort des statistiques). */
  async cancel(userId: string, id: string): Promise<PublicJobOutcome> {
    const existing = await this.prisma.jobOutcome.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Événement introuvable.');
    }
    const outcome = await this.prisma.jobOutcome.update({
      where: { id },
      data: { cancelledAt: new Date() },
    });
    return this.toPublic(outcome);
  }

  /** Met en pause toutes les automatisations actives de l'utilisateur (bouton facultatif). */
  async pauseAllAutomations(userId: string): Promise<{ paused: number }> {
    const result = await this.prisma.automation.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'en_pause' },
    });
    return { paused: result.count };
  }

  private toPublic(o: JobOutcome): PublicJobOutcome {
    return {
      id: o.id,
      contractType: o.contractType,
      companyName: o.companyName,
      helpfulness: o.helpfulness as Helpfulness | null,
      foundAt: o.foundAt.toISOString(),
      cancelledAt: o.cancelledAt ? o.cancelledAt.toISOString() : null,
    };
  }
}
