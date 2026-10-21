import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/app-config.service';
import { Public } from '../auth/public.decorator';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  @Public()
  @Get()
  async health() {
    let database = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = true;
    } catch {
      database = false;
    }
    return {
      status: database ? 'ok' : 'degraded',
      app: this.config.get('APP_NAME'),
      planEnforcement: this.config.planEnforcement,
      jobSourcesMode: this.config.get('JOB_SOURCES_MODE'),
      database,
      timestamp: new Date().toISOString(),
    };
  }
}
