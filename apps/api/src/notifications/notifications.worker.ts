import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Processor('notifications')
export class NotificationsWorker extends WorkerHost {
  private readonly logger = new Logger(NotificationsWorker.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.name} with ID ${job.id}`);
    const appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';

    switch (job.name) {
      case 'task.assigned':
        await this.handleTaskAssigned(job.data, appUrl);
        break;
      case 'task.reminder':
        await this.handleTaskReminder(job.data, appUrl);
        break;
      case 'task.escalated':
        await this.handleTaskEscalated(job.data, appUrl);
        break;
      case 'instance.completed':
        await this.handleInstanceCompleted(job.data, appUrl);
        break;
      case 'instance.rejected':
        await this.handleInstanceRejected(job.data, appUrl);
        break;
      case 'user.invited':
        await this.handleUserInvited(job.data, appUrl);
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleTaskAssigned(data: { taskId: string, assigneeId: string }, appUrl: string) {
    const { taskId, assigneeId } = data;
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        instance: {
          include: { definition: true }
        },
        assignedTo: true,
      }
    });

    if (!task || !task.assignedTo) return;

    const subject = `New Task Assigned: ${task.instance.definition.name}`;
    const taskLink = `${appUrl}/tasks/${taskId}`;
    const content = `
      <p>Hello ${task.assignedTo.name},</p>
      <p>You have a new <strong>${task.type}</strong> step in the workflow: <strong>${task.instance.definition.name}</strong>.</p>
      <a href="${taskLink}" class="button">View Task</a>
    `;

    await this.emailService.sendEmail(task.assignedTo.email, subject, content);
  }

  private async handleTaskReminder(data: { taskId: string }, appUrl: string) {
    const { taskId } = data;
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        instance: { include: { definition: true } },
        assignedTo: true,
      }
    });

    if (!task || !task.assignedTo) return;

    const subject = `Reminder: Task Due Soon - ${task.instance.definition.name}`;
    const taskLink = `${appUrl}/tasks/${taskId}`;
    const content = `
      <p>Hello ${task.assignedTo.name},</p>
      <p>This is a reminder that your task in the workflow <strong>${task.instance.definition.name}</strong> is due within 2 hours.</p>
      <p><strong>Due Date:</strong> ${task.dueAt ? new Date(task.dueAt).toLocaleString() : 'N/A'}</p>
      <a href="${taskLink}" class="button">View Task</a>
    `;

    await this.emailService.sendEmail(task.assignedTo.email, subject, content);
  }

  private async handleTaskEscalated(data: { taskId: string, escalationTargetEmail: string }, appUrl: string) {
    const { taskId, escalationTargetEmail } = data;
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        instance: { include: { definition: true } }
      }
    });

    if (!task) return;

    const subject = `Escalation Notice: Task Overdue - ${task.instance.definition.name}`;
    const taskLink = `${appUrl}/tasks/${taskId}`;
    const content = `
      <p>Hello,</p>
      <p>A task in the workflow <strong>${task.instance.definition.name}</strong> has missed its SLA deadline and has been escalated to you.</p>
      <p>Please review the task immediately.</p>
      <a href="${taskLink}" class="button">Review Escalated Task</a>
    `;

    await this.emailService.sendEmail(escalationTargetEmail, subject, content);
  }

  private async handleInstanceCompleted(data: { instanceId: string }, appUrl: string) {
    const { instanceId } = data;
    const instance = await this.prisma.flowInstance.findUnique({
      where: { id: instanceId },
      include: {
        definition: true,
        initiatedBy: true,
      }
    });

    if (!instance || !instance.initiatedBy) return;

    const subject = `Workflow Completed: ${instance.definition.name}`;
    const instanceLink = `${appUrl}/workflows/instances/${instanceId}`;
    const content = `
      <p>Hello ${instance.initiatedBy.name},</p>
      <p>The workflow you initiated, <strong>${instance.definition.name}</strong>, has been successfully completed.</p>
      <a href="${instanceLink}" class="button">View Workflow Status</a>
    `;

    await this.emailService.sendEmail(instance.initiatedBy.email, subject, content);
  }

  private async handleInstanceRejected(data: { instanceId: string, comment?: string }, appUrl: string) {
    const { instanceId, comment } = data;
    const instance = await this.prisma.flowInstance.findUnique({
      where: { id: instanceId },
      include: {
        definition: true,
        initiatedBy: true,
      }
    });

    if (!instance || !instance.initiatedBy) return;

    const subject = `Workflow Rejected: ${instance.definition.name}`;
    const instanceLink = `${appUrl}/workflows/instances/${instanceId}`;
    const content = `
      <p>Hello ${instance.initiatedBy.name},</p>
      <p>The workflow you initiated, <strong>${instance.definition.name}</strong>, has been rejected.</p>
      ${comment ? `<p><strong>Reason:</strong> ${comment}</p>` : ''}
      <a href="${instanceLink}" class="button">View Workflow Status</a>
    `;

    await this.emailService.sendEmail(instance.initiatedBy.email, subject, content);
  }

  private async handleUserInvited(data: { userId: string, inviteToken: string }, appUrl: string) {
    const { userId, inviteToken } = data;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) return;

    const subject = `Welcome to Workflow Engine - Set Your Password`;
    const setPasswordLink = `${appUrl}/auth/set-password?token=${inviteToken}`;
    const content = `
      <p>Hello ${user.name},</p>
      <p>You have been invited to join the Workflow Engine platform.</p>
      <p>Please click the button below to set your password and access your account.</p>
      <a href="${setPasswordLink}" class="button">Set Password</a>
    `;

    await this.emailService.sendEmail(user.email, subject, content);
  }
}
