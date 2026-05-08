import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { BullModule } from '@nestjs/bullmq';
import { WorkflowsModule } from './workflows/workflows.module';
import { FlowInstancesModule } from './flow-instances/flow-instances.module';
import { WorkflowEngineModule } from './workflow-engine/workflow-engine.module';
import { TasksModule } from './tasks/tasks.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { NotificationsModule } from './notifications/notifications.module';
@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
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
