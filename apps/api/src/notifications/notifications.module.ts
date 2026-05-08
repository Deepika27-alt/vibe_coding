import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailService } from './email.service';
import { NotificationsWorker } from './notifications.worker';
import { SlaSchedulerService } from './sla-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  providers: [EmailService, NotificationsWorker, SlaSchedulerService],
  exports: [BullModule, EmailService],
})
export class NotificationsModule {}
