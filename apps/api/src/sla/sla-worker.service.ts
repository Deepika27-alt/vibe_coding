// SLA Worker Service to handle reminders and escalations
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { WorkflowEngineService } from '../workflow-engine/workflow-engine.service';
import { NotificationDispatcher } from '../notifications/notification-dispatcher.service';
import { TaskStatus, AuditAction } from '@prisma/client';

@Injectable()
export class SLAWorkerService {
  private readonly logger = new Logger(SLAWorkerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowEngine: WorkflowEngineService,
    private readonly notificationDispatcher: NotificationDispatcher,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleSLA() {
    this.logger.log('Running SLA check...');
    const now = new Date();

    // 1. Reminders
    const tasksToRemind = await this.prisma.task.findMany({
      where: {
        status: TaskStatus.PENDING,
        dueAt: {
          lte: new Date(now.getTime() + 2 * 60 * 60 * 1000), // now + 2h
        },
        sla_reminder_sent: false,
      } as any,
    });

    for (const task of tasksToRemind) {
      await this.prisma.task.update({
        where: { id: task.id },
        data: { sla_reminder_sent: true } as any,
      });

      await this.notificationDispatcher.dispatch('task.reminder', {
        taskId: task.id,
      });
      this.logger.log(`Sent reminder for task ${task.id}`);
    }

    // 2. Escalations
    const tasksToEscalate = await this.prisma.task.findMany({
      where: {
        status: TaskStatus.PENDING,
        dueAt: {
          lte: now,
        },
        escalated: false,
      } as any,
      include: {
        instance: {
          include: { definition: true },
        },
        escalation: true,
        assignedTo: true,
      } as any,
    });

    for (const task of tasksToEscalate) {
      await this.escalateTask(task);
    }
  }

  private async escalateTask(task: any) {
    this.logger.log(`Escalating task ${task.id}`);
    const now = new Date();

    await this.prisma.$transaction(async (prisma) => {
      // a. Set task.status = escalated (Wait, prompt says task.status = escalated? TaskStatus enum has ESCALATED)
      // Prompt says: Set task.status = escalated. And also task.escalated = true? 
      // Schema has escalated: Boolean.
      await prisma.task.update({
        where: { id: task.id },
        data: { 
          status: TaskStatus.ESCALATED,
          escalated: true,
        } as any,
      });

      // b. Create new Task assigned to escalation target
      const graph = task.instance.definition.graph as any;
      const node = graph?.nodes?.find((n: any) => n.id === task.stepId);
      
      const escalationTarget = task.escalation;
      if (!escalationTarget) {
        this.logger.warn(`No escalation target for task ${task.id}`);
        return;
      }

      const sla = node?.sla || node?.config?.sla;
      const escalationHours = sla?.escalationHours || 24;

      const newNode = {
        ...node,
        assignedToId: escalationTarget.targetUserId,
        assignedRoleId: escalationTarget.targetRoleId,
        sla: {
          ...sla,
          durationHours: escalationHours, // New dueAt = now + sla.escalationHours
        },
      };

      const newTask = await this.workflowEngine.createTask(prisma, task.instanceId, newNode);

      // c. Create AuditEvent (action=escalated)
      await prisma.auditEvent.create({
        data: {
          instanceId: task.instanceId,
          actorId: task.assignedToId || task.instance.initiatedById, // Use assignee if available, else initiator
          action: AuditAction.ESCALATED,
          stepId: task.stepId,
          note: `Task escalated from ${task.assignedToId || 'role ' + task.assignedRoleId} to ${escalationTarget.targetUserId || 'role ' + escalationTarget.targetRoleId}`,
        },
      });

      // d. Enqueue task.escalated notification to escalation target
      if (escalationTarget.targetUserId) {
        const targetUser = await prisma.user.findUnique({ where: { id: escalationTarget.targetUserId } });
        if (targetUser) {
          await this.notificationDispatcher.dispatch('task.escalated', {
            taskId: newTask.id,
            escalationTargetEmail: targetUser.email,
          });
        }
      }

      // e.g. Notify original assignee
      if (task.assignedToId) {
        await this.notificationDispatcher.dispatch('task.escalated_assignee', {
          taskId: task.id,
        });
      }
    });
  }
}
