import { Module } from '@nestjs/common';
import { FlowInstancesController } from './flow-instances.controller';
import { FlowInstancesService } from './flow-instances.service';

@Module({
  controllers: [FlowInstancesController],
  providers: [FlowInstancesService]
})
export class FlowInstancesModule {}
