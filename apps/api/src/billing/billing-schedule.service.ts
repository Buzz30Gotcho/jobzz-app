import { Injectable, Logger, type OnApplicationBootstrap, type OnModuleDestroy } from '@nestjs/common';
import PgBoss from 'pg-boss';
import { AppConfigService } from '../config/app-config.service';
import { BillingService } from './billing.service';

const DAILY_QUEUE = 'billing.daily';

/**
 * Tâche quotidienne (pg-boss) : repasse en gratuit les comptes dont `premiumUntil` est dépassé
 * (Pass 3 mois terminés) et envoie le préavis 7 jours avant la fin d'un Pass (CLAUDE.md §2.1).
 * Démarrage robuste : si pg-boss ne démarre pas, l'app fonctionne quand même. Désactivé en test.
 */
@Injectable()
export class BillingScheduleService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(BillingScheduleService.name);
  private boss: PgBoss | null = null;

  constructor(
    private readonly config: AppConfigService,
    private readonly billing: BillingService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.config.get('NODE_ENV') === 'test') return;
    try {
      this.boss = new PgBoss(this.config.get('DATABASE_URL'));
      this.boss.on('error', (err) => this.logger.warn(`pg-boss (billing) : ${err.message}`));
      await this.boss.start();
      await this.boss.work(DAILY_QUEUE, () => this.runDaily());
      // Tous les jours à 6 h (heure du serveur) : peu de charge, hors heures d'affluence.
      await this.boss.schedule(DAILY_QUEUE, '0 6 * * *');
      this.logger.log('pg-boss démarré, tâche billing.daily planifiée.');
    } catch (err) {
      this.logger.warn(`pg-boss indisponible (${(err as Error).message}) — tâche billing désactivée.`);
      this.boss = null;
    }
  }

  private async runDaily(): Promise<void> {
    const expired = await this.billing.expireLapsedPremium();
    const noticed = await this.billing.noticePassEnding();
    this.logger.log(`billing.daily : ${expired} comptes repassés en gratuit, ${noticed} préavis Pass.`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.boss?.stop({ graceful: true }).catch(() => undefined);
  }
}
