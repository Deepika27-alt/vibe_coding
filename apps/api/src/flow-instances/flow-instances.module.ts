import { Module } from '@nestjs/common';
import { FlowInstancesController } from './flow-instances.controller';
import { FlowInstancesService } from './flow-instances.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkflowEngineModule } from '../workflow-engine/workflow-engine.module';

@Module({
  imports: [PrismaModule, WorkflowEngineModule],
  controllers: [FlowInstancesController],
  providers: [FlowInstancesService]
})
export class FlowInstancesModule {}
