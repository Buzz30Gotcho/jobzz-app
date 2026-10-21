import { Injectable, Logger, type OnApplicationBootstrap, type OnModuleDestroy } from '@nestjs/common';
import PgBoss from 'pg-boss';
import { AUTOMATIONS } from '@jobzz/shared';
import { AppConfigService } from '../config/app-config.service';
import { AutomationRunnerService } from './automation-runner.service';

const TICK_QUEUE = 'automations.tick';

/**
 * File de tâches (pg-boss) : planifie la tâche `automations.tick` (CLAUDE.md §4.6, §7). Démarrage
 * robuste : si pg-boss ne démarre pas, l'application fonctionne quand même (les automatisations
 * peuvent être lancées manuellement). Désactivé en environnement de test.
 */
@Injectable()
export class QueueService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private boss: PgBoss | null = null;

  constructor(
    private readonly config: AppConfigService,
    private readonly runner: AutomationRunnerService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.config.get('NODE_ENV') === 'test') return;
    try {
      this.boss = new PgBoss(this.config.get('DATABASE_URL'));
      this.boss.on('error', (err) => this.logger.warn(`pg-boss : ${err.message}`));
      await this.boss.start();
      await this.boss.work(TICK_QUEUE, () => this.runner.runAll());
      // Toutes les heures (configurable). Cron : minute 0 de chaque heure.
      await this.boss.schedule(TICK_QUEUE, `0 */${Math.max(1, Math.round(AUTOMATIONS.tickEveryMinutes / 60))} * * *`);
      this.logger.log('pg-boss démarré, tâche automations.tick planifiée.');
    } catch (err) {
      this.logger.warn(`pg-boss indisponible (${(err as Error).message}) — exécution planifiée désactivée.`);
      this.boss = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.boss?.stop({ graceful: true }).catch(() => undefined);
  }
}
