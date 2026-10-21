import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

/** Candidatures et relances (CLAUDE.md §4.3). EntitlementsService est fourni globalement. */
@Module({
  imports: [UsersModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
