import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { NotificationDispatcher } from './notification-dispatcher.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [EmailService, NotificationDispatcher],
  exports: [EmailService, NotificationDispatcher],
})
export class NotificationsModule {}

