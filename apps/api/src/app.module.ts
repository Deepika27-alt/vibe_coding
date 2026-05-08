import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { FlowInstancesModule } from './flow-instances/flow-instances.module';
import { WorkflowEngineModule } from './workflow-engine/workflow-engine.module';
import { TasksModule } from './tasks/tasks.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    WorkflowsModule,
    FlowInstancesModule,
    WorkflowEngineModule,
    TasksModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    NotificationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
