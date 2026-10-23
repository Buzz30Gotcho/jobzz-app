import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger as PinoLogger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';

async function bootstrap(): Promise<void> {
  // `rawBody: true` conserve le corps brut sur `req.rawBody` : nécessaire pour vérifier la
  // signature du webhook Stripe (CLAUDE.md §2.1).
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });
  app.useLogger(app.get(PinoLogger));

  const config = app.get(AppConfigService);

  app.use(helmet());
  app.use(cookieParser());
  app.setGlobalPrefix('api');

  // CORS restreint au front (CLAUDE.md §4.1).
  app.enableCors({
    origin: config.get('APP_URL'),
    credentials: true,
  });

  app.enableShutdownHooks();

  const port = config.get('API_PORT');
  await app.listen(port);
  app.get(PinoLogger).log(`Jobzz API démarrée sur http://localhost:${port}/api`);
}

void bootstrap();
