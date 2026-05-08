import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationDispatcher } from './notification-dispatcher.service';

@Injectable()
export class SlaSchedulerService {
  private readonly logger = new Logger(SlaSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationDispatcher: NotificationDispatcher,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleSlaChecks() {
    this.logger.log('Running SLA checks for tasks...');
    await this.processReminders();
    await this.processEscalations();
  }

  private async processReminders() {
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const tasksToRemind = await this.prisma.task.findMany({
      where: {
        status: 'PENDING',
        dueAt: { lte: twoHoursFromNow, gt: now },
        reminderSent: false,
      },
    });

    if (tasksToRemind.length === 0) return;

    this.logger.log(`Found ${tasksToRemind.length} tasks needing reminders.`);

    for (const task of tasksToRemind) {
      await this.notificationDispatcher.dispatch('task.reminder', { taskId: task.id });
      await this.prisma.task.update({
        where: { id: task.id },
        data: { reminderSent: true },
      });
      this.logger.log(`Dispatched reminder for task ${task.id}`);
    }
  }

  private async processEscalations() {
    const now = new Date();

    const overdueTasks = await this.prisma.task.findMany({
      where: {
        status: 'PENDING',
        dueAt: { lt: now },
      },
      include: {
        instance: {
          include: { definition: true },
        },
      },
    });

    if (overdueTasks.length === 0) return;

    this.logger.log(`Found ${overdueTasks.length} overdue tasks needing escalation.`);

    for (const task of overdueTasks) {
      try {
        const graph = task.instance.definition.graph as any;
        const stepNode = graph?.nodes?.find((n: any) => n.id === task.stepId);
        const escalationTargetEmail = stepNode?.data?.escalationTargetEmail;

        if (escalationTargetEmail) {
          await this.notificationDispatcher.dispatch('task.escalated', {
            taskId: task.id,
            escalationTargetEmail,
          });
          this.logger.log(`Dispatched escalation for task ${task.id} to ${escalationTargetEmail}`);
        } else {
          this.logger.warn(`No escalationTargetEmail found for task ${task.id} (step ${task.stepId})`);
        }

        // Update task status to ESCALATED
        await this.prisma.task.update({
          where: { id: task.id },
          data: { status: 'ESCALATED' },
        });

        // Add audit event
        await this.prisma.auditEvent.create({
          data: {
            instanceId: task.instanceId,
            actorId: task.instance.initiatedById, // Or a system user ID if available, defaulting to initiator
            action: 'ESCALATED',
            stepId: task.stepId,
            note: 'Task automatically escalated due to SLA breach',
          },
        });
      } catch (error) {
        this.logger.error(`Failed to process escalation for task ${task.id}`, error);
      }
    }
  }
}
