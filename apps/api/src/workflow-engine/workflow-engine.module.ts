import { Module } from '@nestjs/common';
import { WorkflowEngineService } from './workflow-engine.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [WorkflowEngineService],
  exports: [WorkflowEngineService]
})
export class WorkflowEngineModule {}
