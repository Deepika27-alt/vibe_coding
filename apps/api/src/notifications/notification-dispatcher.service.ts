import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationDispatcher {
  private readonly logger = new Logger(NotificationDispatcher.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async dispatch(event: string, data: any) {
    this.logger.log(`Dispatching event: ${event}`);
    const appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';

    try {
      switch (event) {
        case 'task.assigned':
          await this.handleTaskAssigned(data, appUrl);
          break;
        case 'task.reminder':
          await this.handleTaskReminder(data, appUrl);
          break;
        case 'task.escalated':
          await this.handleTaskEscalated(data, appUrl);
          break;
        case 'task.escalated_assignee':
          await this.handleTaskEscalatedAssignee(data, appUrl);
          break;
        case 'instance.completed':
          await this.handleInstanceCompleted(data, appUrl);
          break;
        case 'instance.rejected':
          await this.handleInstanceRejected(data, appUrl);
          break;
        case 'user.invited':
          await this.handleUserInvited(data, appUrl);
          break;
        default:
          this.logger.warn(`Unknown event: ${event}`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to dispatch event ${event}: ${error.message}`);
    }
  }

  private async handleTaskAssigned(data: { taskId: string, assigneeId: string }, appUrl: string) {
    const { taskId } = data;
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
      <a href="${taskLink}">View Task</a>
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
      <p>This is a reminder that your task in the workflow <strong>${task.instance.definition.name}</strong> is due soon.</p>
      <a href="${taskLink}">View Task</a>
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
      <p>A task in the workflow <strong>${task.instance.definition.name}</strong> has missed its SLA deadline and has been escalated.</p>
      <a href="${taskLink}">Review Task</a>
    `;

    await this.emailService.sendEmail(escalationTargetEmail, subject, content);
  }

  private async handleTaskEscalatedAssignee(data: { taskId: string }, appUrl: string) {
    const { taskId } = data;
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        instance: { include: { definition: true } },
        assignedTo: true,
      }
    });

    if (!task || !task.assignedTo) return;

    const subject = `Notice: Your Task was Escalated - ${task.instance.definition.name}`;
    const content = `
      <p>Hello ${task.assignedTo.name},</p>
      <p>The task assigned to you in the workflow <strong>${task.instance.definition.name}</strong> has been escalated because it passed its deadline.</p>
      <p>The task is no longer assigned to you.</p>
    `;

    await this.emailService.sendEmail(task.assignedTo.email, subject, content);
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
    const content = `
      <p>Hello ${instance.initiatedBy.name},</p>
      <p>The workflow <strong>${instance.definition.name}</strong> has been successfully completed.</p>
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
    const content = `
      <p>Hello ${instance.initiatedBy.name},</p>
      <p>The workflow <strong>${instance.definition.name}</strong> has been rejected.</p>
      ${comment ? `<p><strong>Reason:</strong> ${comment}</p>` : ''}
    `;

    await this.emailService.sendEmail(instance.initiatedBy.email, subject, content);
  }

  private async handleUserInvited(data: { userId: string, email: string, name: string }, appUrl: string) {
    const { email, name } = data;
    const subject = `Welcome to Workflow Engine`;
    const content = `
      <p>Hello ${name},</p>
      <p>You have been invited to join the Workflow Engine platform.</p>
      <p>Please login to your account to get started.</p>
    `;

    await this.emailService.sendEmail(email, subject, content);
  }
}
