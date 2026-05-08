import { Module } from '@nestjs/common';
import { SLAWorkerService } from './sla-worker.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkflowEngineModule } from '../workflow-engine/workflow-engine.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, WorkflowEngineModule, NotificationsModule],
  providers: [SLAWorkerService],
})
export class SLAModule {}
