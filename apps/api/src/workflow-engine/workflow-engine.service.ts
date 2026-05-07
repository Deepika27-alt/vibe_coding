import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FlowInstanceStatus, TaskType } from '@prisma/client';

@Injectable()
export class WorkflowEngineService {
  constructor(private readonly prisma: PrismaService) {}

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

        if (node.type === 'End') {
          reachedEnd = true;
          if (node.config && node.config.endStatus) {
            endNodeStatus = node.config.endStatus as FlowInstanceStatus;
          }
          continue;
        }

        if (node.type === 'Condition') {
          const conditionEdges = edges.filter((e: any) => e.source === node.id);
          let matchedEdge = null;
          let defaultEdge = null;

          for (const edge of conditionEdges) {
            if (!edge.condition) {
              defaultEdge = edge;
              continue;
            }
            const { field, operator, value } = edge.condition;
            const instanceVal = (instance.data as any)[field];
            
            let isMatch = false;
            if (operator === '==' && instanceVal == value) isMatch = true;
            else if (operator === '!=' && instanceVal != value) isMatch = true;
            else if (operator === '>' && instanceVal > value) isMatch = true;
            else if (operator === '<' && instanceVal < value) isMatch = true;
            else if (operator === '>=' && instanceVal >= value) isMatch = true;
            else if (operator === '<=' && instanceVal <= value) isMatch = true;
            
            if (isMatch) {
              matchedEdge = edge;
              break;
            }
          }

          const edgeToFollow = matchedEdge || defaultEdge;
          if (edgeToFollow) {
            currentStepsToProcess.push(edgeToFollow.target);
          }
        } else {
          nextStepIdsToCreate.add(node.id);
        }
      }

      const createdTasks = [];
      const actorId = completedTask.completedById || instance.initiatedById;

      for (const nextStepId of nextStepIdsToCreate) {
        const node = nodes.find((n: any) => n.id === nextStepId);
        if (!node) continue;

        const taskTypeMap: Record<string, TaskType> = {
          'Form': 'FORM',
          'Approval': 'APPROVAL',
          'Manual': 'MANUAL',
        };

        const task = await prisma.task.create({
          data: {
            instanceId: instance.id,
            stepId: nextStepId,
            type: taskTypeMap[node.type] || 'MANUAL',
            status: 'PENDING',
            assignedRoleId: node.assignedRoleId || null,
            assignedToId: node.assignedToId || null,
          },
        });
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
}
