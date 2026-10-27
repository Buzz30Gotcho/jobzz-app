import { Module } from '@nestjs/common';
import { AutomationsModule } from '../automations/automations.module';
import { SupportModule } from '../support/support.module';
import { AdminBootstrapService } from './admin-bootstrap.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [AutomationsModule, SupportModule],
  controllers: [AdminController],
  providers: [AdminBootstrapService, AdminService],
})
export class AdminModule {}
