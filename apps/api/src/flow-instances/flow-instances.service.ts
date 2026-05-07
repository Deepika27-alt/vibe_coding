import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFlowInstanceDto } from './dto/create-flow-instance.dto';
import { FlowInstanceStatus, TaskType, AuditAction } from '@prisma/client';

@Injectable()
export class FlowInstancesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createFlowInstanceDto: CreateFlowInstanceDto, userId: string) {
    return this.prisma.$transaction(async (prisma) => {
      const workflow = await prisma.workflowDefinition.findUnique({
        where: { id: createFlowInstanceDto.workflowDefinitionId },
      });

      if (!workflow) throw new NotFoundException('Workflow not found');
      if (workflow.status !== 'PUBLISHED') throw new BadRequestException('Workflow is not published');

      const graph: any = workflow.graph;
      const nodes = graph?.nodes || [];
      const edges = graph?.edges || [];

      const startNode = nodes.find((n: any) => n.type === 'Start');
      if (!startNode) throw new BadRequestException('Graph has no Start node');

      const nextEdge = edges.find((e: any) => e.source === startNode.id);
      if (!nextEdge) throw new BadRequestException('Start node is not connected');

      const nextNode = nodes.find((n: any) => n.id === nextEdge.target);

      const instance = await prisma.flowInstance.create({
        data: {
          definitionId: workflow.id,
          definitionVersion: workflow.version,
          status: 'ACTIVE',
          currentStepId: nextNode?.id || 'UNKNOWN',
          data: {},
          initiatedById: userId,
        },
      });

      await prisma.auditEvent.create({
        data: {
          instanceId: instance.id,
          actorId: userId,
          action: 'STARTED',
          stepId: startNode.id,
        },
      });

      if (nextNode && nextNode.type !== 'End') {
        const taskTypeMap: Record<string, TaskType> = {
          'Form': 'FORM',
          'Approval': 'APPROVAL',
          'Manual': 'MANUAL',
        };

        await prisma.task.create({
          data: {
            instanceId: instance.id,
            stepId: nextNode.id,
            type: taskTypeMap[nextNode.type] || 'MANUAL',
            status: 'PENDING',
            assignedRoleId: nextNode.assignedRoleId || null,
            assignedToId: nextNode.assignedToId || null,
          },
        });
      } else if (nextNode && nextNode.type === 'End') {
        await prisma.flowInstance.update({
          where: { id: instance.id },
          data: { status: 'COMPLETED' },
        });
        await prisma.auditEvent.create({
          data: {
            instanceId: instance.id,
            actorId: userId,
            action: 'COMPLETED',
            stepId: nextNode.id,
          },
        });
      }

      return instance;
    });
  }

  async findAllByInitiator(userId: string, status?: FlowInstanceStatus) {
    return this.prisma.flowInstance.findMany({
      where: {
        initiatedById: userId,
        ...(status ? { status } : {}),
      },
      include: {
        definition: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const instance = await this.prisma.flowInstance.findUnique({
      where: { id },
      include: {
        tasks: { orderBy: { createdAt: 'asc' } },
        auditEvents: {
          orderBy: { createdAt: 'asc' },
          include: { actor: { select: { name: true, email: true } } },
        },
      },
    });

    if (!instance) throw new NotFoundException('Instance not found');
    return instance;
  }

  async findAssignedTasks(userId: string, userRoles: string[]) {
    const roles = await this.prisma.role.findMany({
      where: { name: { in: userRoles } },
    });
    const roleIds = roles.map(r => r.id);

    return this.prisma.task.findMany({
      where: {
        status: 'PENDING',
        OR: [
          { assignedToId: userId },
          { assignedRoleId: { in: roleIds } },
        ],
      },
      include: {
        instance: {
          include: { definition: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
