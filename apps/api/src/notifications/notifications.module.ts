import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { NotificationDispatcher } from './notification-dispatcher.service';
import { SlaSchedulerService } from './sla-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [EmailService, NotificationDispatcher, SlaSchedulerService],
  exports: [EmailService, NotificationDispatcher],
})
export class NotificationsModule {}
