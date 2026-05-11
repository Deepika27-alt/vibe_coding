import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FlowInstanceStatus, TaskType } from '@prisma/client';
import { NotificationDispatcher } from '../notifications/notification-dispatcher.service';

@Injectable()
export class WorkflowEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationDispatcher: NotificationDispatcher,
  ) { }

  async advanceInstance(instanceId: string, completedTaskId: string) {
    return this.prisma.$transaction(async (prisma) => {
      const instance = await prisma.flowInstance.findUnique({
        where: { id: instanceId },
        include: {
          definition: true,
          tasks: { where: { id: completedTaskId } },
        },
      });

      if (!instance) throw new NotFoundException('Instance not found');
      const completedTask = instance.tasks[0];
      if (!completedTask) throw new NotFoundException('Completed task not found');

      const graph: any = instance.definition.graph;
      const nodes = graph?.nodes || [];
      const edges = graph?.edges || [];

      const currentStepId = completedTask.stepId;
      const outgoingEdges = edges.filter((e: any) => e.source === currentStepId);

      const currentStepsToProcess = outgoingEdges.map((e: any) => e.target);
      const nextStepIdsToCreate = new Set<string>();
      let reachedEnd = false;
      let endNodeStatus: FlowInstanceStatus = FlowInstanceStatus.COMPLETED;

      while (currentStepsToProcess.length > 0) {
        const stepId = currentStepsToProcess.pop();
        const node = nodes.find((n: any) => n.id === stepId);

        if (!node) continue;

        if (node.type.toLowerCase() === 'end') {
          reachedEnd = true;
          if (node.config && node.config.endStatus) {
            endNodeStatus = node.config.endStatus as FlowInstanceStatus;
          }
          continue;
        }

        if (node.type.toLowerCase() === 'condition') {
          const { conditionField, conditionOperator, conditionValue, branches } = node.data || {};
          const instanceVal = (instance.data as any)[conditionField];

          let matchedBranch = 'False';
          const val = instanceVal;
          const target = conditionValue;

          let isMatch = false;
          if (conditionOperator === 'equals' && val == target) isMatch = true;
          else if (conditionOperator === 'contains' && String(val).includes(target)) isMatch = true;
          else if (conditionOperator === 'gt' && Number(val) > Number(target)) isMatch = true;
          else if (conditionOperator === 'lt' && Number(val) < Number(target)) isMatch = true;
          else if (conditionOperator === 'empty' && (!val || val === '')) isMatch = true;

          matchedBranch = isMatch ? (branches?.[0] || 'True') : (branches?.[1] || 'False');

          const conditionEdges = edges.filter((e: any) => e.source === node.id);
          const edgeToFollow = conditionEdges.find((e: any) => e.sourceHandle === matchedBranch) ||
            conditionEdges.find((e: any) => e.label === matchedBranch) ||
            conditionEdges[0];

          if (edgeToFollow) {
            currentStepsToProcess.push(edgeToFollow.target);
          }
        } else if (node.type.toLowerCase() === 'action') {
          // Automated action execution
          const { actionType, actionConfig } = node.data || {};

          // Log the action for now
          console.log(`Executing automated action: ${actionType}`, actionConfig);

          if (actionType === 'email') {
            await this.notificationDispatcher.dispatch('task.action_executed', {
              instanceId: instance.id,
              actionNote: `Email sent using template: ${actionConfig?.templateId}`,
            });
          }

          // Advance to next step automatically
          const outgoingEdges = edges.filter((e: any) => e.source === node.id);
          outgoingEdges.forEach((e: any) => currentStepsToProcess.push(e.target));
        } else {
          nextStepIdsToCreate.add(node.id);
        }
      }

      const createdTasks = [];
      const actorId = completedTask.completedById || instance.initiatedById;

      for (const nextStepId of nextStepIdsToCreate) {
        const node = nodes.find((n: any) => n.id === nextStepId);
        if (!node) continue;

        const task = await this.createTask(prisma, instance.id, node);
        createdTasks.push(task);
      }

      if (reachedEnd && nextStepIdsToCreate.size === 0) {
        await prisma.flowInstance.update({
          where: { id: instance.id },
          data: {
            status: endNodeStatus,
            currentStepId: 'END',
          },
        });

        await prisma.auditEvent.create({
          data: {
            instanceId: instance.id,
            actorId: actorId,
            action: 'COMPLETED',
            note: `Instance reached end with status: ${endNodeStatus}`,
          },
        });

        // Notify initiator
        await this.notificationDispatcher.dispatch('instance.completed', {
          instanceId: instance.id,
        });

      } else if (nextStepIdsToCreate.size > 0) {
        await prisma.flowInstance.update({
          where: { id: instance.id },
          data: {
            currentStepId: Array.from(nextStepIdsToCreate).join(','),
          },
        });

        await prisma.auditEvent.create({
          data: {
            instanceId: instance.id,
            actorId: actorId,
            action: 'SUBMITTED',
            note: `Advanced to steps: ${Array.from(nextStepIdsToCreate).join(', ')}`,
          },
        });
      }

      return { instanceId, createdTasks, reachedEnd, endNodeStatus };
    });
  }

  async createTask(prisma: any, instanceId: string, node: any) {
    const type = node.type.toLowerCase();
    const taskTypeMap: Record<string, TaskType> = {
      'form': 'FORM',
      'approval': 'APPROVAL',
      'manual': 'MANUAL',
    };

    const taskType = taskTypeMap[type] || 'MANUAL';

    const now = new Date();
    let dueAt: Date | null = null;
    const sla = node.data?.sla || node.config?.sla;

    if (typeof sla === 'number') {
      dueAt = new Date(now.getTime() + sla * 60 * 60 * 1000);
    } else if (sla && sla.durationHours) {
      dueAt = new Date(now.getTime() + sla.durationHours * 60 * 60 * 1000);
    }

    const task = await prisma.task.create({
      data: {
        instanceId,
        stepId: node.id,
        type: taskType,
        status: 'PENDING',
        assignedRoleId: node.data?.assigneeType === 'role' ? node.data?.assigneeId : null,
        assignedToId: node.data?.assigneeType === 'user' ? node.data?.assigneeId : null,
        dueAt,
      },
    });

    if (sla && (sla.targetUserId || sla.targetRoleId || node.data?.escalationTarget)) {
      const bufferHours = sla.bufferHours || 2;
      const notifyAt = dueAt
        ? new Date(dueAt.getTime() - bufferHours * 60 * 60 * 1000)
        : new Date(now.getTime());

      await prisma.taskEscalation.create({
        data: {
          taskId: task.id,
          targetUserId: sla.targetUserId || null,
          targetRoleId: sla.targetRoleId || null,
          notifyAt,
        },
      });
    }

    // Notify assignee (if it's a specific user)
    if (task.assignedToId) {
      await this.notificationDispatcher.dispatch('task.assigned', {
        taskId: task.id,
        assigneeId: task.assignedToId,
      });
    }

    return task;
  }
}
