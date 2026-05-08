import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkflowEngineService } from '../workflow-engine/workflow-engine.service';
import { 
  SubmitTaskDto, 
  ApproveTaskDto, 
  RejectTaskDto, 
  SendbackTaskDto, 
  CompleteTaskDto 
} from './dto/task-actions.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowEngine: WorkflowEngineService,
  ) {}

  private async getTaskAndValidateAccess(id: string, user: any) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        instance: {
          include: {
            definition: true,
            initiatedBy: true,
          }
        },
        assignedRole: true,
      }
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.status !== 'PENDING') {
      throw new BadRequestException(`Task is not in PENDING state (current: ${task.status})`);
    }

    let hasAccess = false;
    if (task.assignedToId === user.id) {
      hasAccess = true;
    } else if (task.assignedRole && user.roles.includes(task.assignedRole.name)) {
      hasAccess = true;
    }

    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to action this task');
    }

    return task;
  }

  async findUserInbox(user: any) {
    const tasks = await this.prisma.task.findMany({
      where: {
        status: 'PENDING',
        OR: [
          { assignedToId: user.id },
          { assignedRole: { name: { in: user.roles } } }
        ]
      },
      include: {
        instance: {
          include: {
            definition: true,
            initiatedBy: true,
            auditEvents: {
              orderBy: { createdAt: 'desc' },
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const now = new Date();

    return tasks.map(task => {
      const graph = task.instance.definition.graph as any;
      const node = graph?.nodes?.find((n: any) => n.id === task.stepId);
      
      let slaStatus = 'on_time';
      if (task.dueAt) {
        const due = new Date(task.dueAt);
        const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (diffHours < 0) {
          slaStatus = 'breached';
        } else if (diffHours < 2) {
          slaStatus = 'at_risk';
        } else {
          slaStatus = 'on_time';
        }
      }

      return {
        taskId: task.id,
        type: task.type,
        stepName: node?.name || task.stepId,
        workflowName: task.instance.definition.name,
        instanceId: task.instanceId,
        initiatorName: task.instance.initiatedBy.name,
        dueAt: task.dueAt,
        slaStatus,
        stepHistory: task.instance.auditEvents.slice(0, 5) // recent history
      };
    });
  }

  async findOne(id: string, user: any) {
    const task = await this.getTaskAndValidateAccess(id, user);

    const formDefinition = await this.prisma.formDefinition.findFirst({
      where: { 
        definitionId: task.instance.definitionId,
        stepId: task.stepId
      }
    });

    const auditTrail = await this.prisma.auditEvent.findMany({
      where: { instanceId: task.instanceId },
      orderBy: { createdAt: 'desc' },
      include: { actor: { select: { name: true, email: true } } }
    });

    return {
      task,
      instanceData: task.instance.data,
      formDefinition: formDefinition || null,
      auditTrail
    };
  }

  async submitTask(id: string, dto: SubmitTaskDto, user: any) {
    const task = await this.getTaskAndValidateAccess(id, user);

    if (task.type !== 'FORM') {
      throw new BadRequestException('Task type is not FORM');
    }

    const formDef = await this.prisma.formDefinition.findFirst({
      where: { definitionId: task.instance.definitionId, stepId: task.stepId }
    });

    if (formDef && Array.isArray(formDef.fields)) {
      for (const field of formDef.fields as any[]) {
        if (field.required && (dto.formData[field.name] === undefined || dto.formData[field.name] === null || dto.formData[field.name] === '')) {
          throw new BadRequestException(`Field ${field.name} is required`);
        }
      }
    }

    const currentData = task.instance.data as Record<string, any>;
    const newData = { ...currentData, ...dto.formData };

    await this.prisma.$transaction(async (prisma) => {
      await prisma.flowInstance.update({
        where: { id: task.instanceId },
        data: { data: newData }
      });

      await prisma.task.update({
        where: { id },
        data: { 
          status: 'COMPLETED',
          completedById: user.id,
          completedAt: new Date()
        }
      });

      await prisma.auditEvent.create({
        data: {
          instanceId: task.instanceId,
          actorId: user.id,
          action: 'SUBMITTED',
          stepId: task.stepId,
          note: 'Form submitted',
        }
      });
    });

    return this.workflowEngine.advanceInstance(task.instanceId, id);
  }

  async approveTask(id: string, dto: ApproveTaskDto, user: any) {
    const task = await this.getTaskAndValidateAccess(id, user);

    if (task.type !== 'APPROVAL') {
      throw new BadRequestException('Task type is not APPROVAL');
    }

    await this.prisma.$transaction(async (prisma) => {
      await prisma.task.update({
        where: { id },
        data: { 
          status: 'COMPLETED',
          completedById: user.id,
          completedAt: new Date(),
          comment: dto.comment
        }
      });

      await prisma.auditEvent.create({
        data: {
          instanceId: task.instanceId,
          actorId: user.id,
          action: 'APPROVED',
          stepId: task.stepId,
          note: dto.comment || 'Task approved',
        }
      });
    });

    return this.workflowEngine.advanceInstance(task.instanceId, id);
  }

  async rejectTask(id: string, dto: RejectTaskDto, user: any) {
    const task = await this.getTaskAndValidateAccess(id, user);

    if (task.type !== 'APPROVAL') {
      throw new BadRequestException('Task type is not APPROVAL');
    }

    return this.prisma.$transaction(async (prisma) => {
      await prisma.task.update({
        where: { id },
        data: { 
          status: 'REJECTED',
          completedById: user.id,
          completedAt: new Date(),
          comment: dto.comment
        }
      });

      await prisma.auditEvent.create({
        data: {
          instanceId: task.instanceId,
          actorId: user.id,
          action: 'REJECTED',
          stepId: task.stepId,
          note: dto.comment,
        }
      });

      const graph = task.instance.definition.graph as any;
      const edges = graph?.edges || [];
      const rejectEdge = edges.find((e: any) => 
        e.source === task.stepId && 
        (e.type === 'reject' || e.label?.toLowerCase() === 'rejected' || e.condition?.value === 'REJECTED')
      );

      if (rejectEdge) {
        const nodes = graph?.nodes || [];
        const targetNode = nodes.find((n: any) => n.id === rejectEdge.target);
        
        if (targetNode) {
          const taskTypeMap: Record<string, any> = {
            'Form': 'FORM',
            'Approval': 'APPROVAL',
            'Manual': 'MANUAL',
          };

          if (targetNode.type === 'End') {
             await prisma.flowInstance.update({
               where: { id: task.instanceId },
               data: { currentStepId: 'END', status: targetNode.config?.endStatus || 'REJECTED' }
             });
          } else {
             await prisma.flowInstance.update({
               where: { id: task.instanceId },
               data: { currentStepId: targetNode.id }
             });

             await this.workflowEngine.createTask(prisma, task.instanceId, targetNode);
          }
          return { message: 'Rejected, followed rejection path', instanceId: task.instanceId };
        }
      }

      await prisma.flowInstance.update({
        where: { id: task.instanceId },
        data: { status: 'REJECTED', currentStepId: 'END' }
      });

      return { message: 'Rejected, flow ended', instanceId: task.instanceId };
    });
  }

  async sendbackTask(id: string, dto: SendbackTaskDto, user: any) {
    const task = await this.getTaskAndValidateAccess(id, user);

    return this.prisma.$transaction(async (prisma) => {
      await prisma.task.update({
        where: { id },
        data: { 
          status: 'SENT_BACK',
          completedById: user.id,
          completedAt: new Date(),
          comment: dto.comment
        }
      });

      await prisma.auditEvent.create({
        data: {
          instanceId: task.instanceId,
          actorId: user.id,
          action: 'SENT_BACK',
          stepId: task.stepId,
          note: `Sent back to ${dto.targetStepId}: ${dto.comment}`,
        }
      });

      const graph = task.instance.definition.graph as any;
      const nodes = graph?.nodes || [];
      const targetNode = nodes.find((n: any) => n.id === dto.targetStepId);

      if (!targetNode) {
        throw new BadRequestException('Target step ID not found in workflow graph');
      }

      const taskTypeMap: Record<string, any> = {
        'Form': 'FORM',
        'Approval': 'APPROVAL',
        'Manual': 'MANUAL',
      };

      await prisma.flowInstance.update({
        where: { id: task.instanceId },
        data: { currentStepId: targetNode.id }
      });

      const newTask = await this.workflowEngine.createTask(prisma, task.instanceId, targetNode);

      return { message: 'Task sent back successfully', newTask };
    });
  }

  async completeTask(id: string, dto: CompleteTaskDto, user: any) {
    const task = await this.getTaskAndValidateAccess(id, user);

    if (task.type !== 'MANUAL') {
      throw new BadRequestException('Task type is not MANUAL');
    }

    await this.prisma.$transaction(async (prisma) => {
      await prisma.task.update({
        where: { id },
        data: { 
          status: 'COMPLETED',
          completedById: user.id,
          completedAt: new Date(),
          comment: dto.comment
        }
      });

      await prisma.auditEvent.create({
        data: {
          instanceId: task.instanceId,
          actorId: user.id,
          action: 'COMPLETED',
          stepId: task.stepId,
          note: dto.comment || 'Task marked as complete',
        }
      });
    });

    return this.workflowEngine.advanceInstance(task.instanceId, id);
  }
}
