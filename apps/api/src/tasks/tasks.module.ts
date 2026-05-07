import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkflowEngineModule } from '../workflow-engine/workflow-engine.module';

@Module({
  imports: [PrismaModule, WorkflowEngineModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
