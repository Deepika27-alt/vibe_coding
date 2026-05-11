import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { WorkflowStatus } from '@prisma/client';

interface GraphNode {
  id: string;
  type: string;
  fields?: Record<string, any>;
  [key: string]: any;
}

interface GraphEdge {
  source: string;
  target: string;
  [key: string]: any;
}

@Injectable()
export class WorkflowsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createWorkflowDto: CreateWorkflowDto, userId: string) {
    return this.prisma.workflowDefinition.create({
      data: {
        name: createWorkflowDto.name,
        description: createWorkflowDto.description,
        department: createWorkflowDto.department,
        graph: createWorkflowDto.graph,
        createdById: userId,
        status: WorkflowStatus.DRAFT,
        version: 1,
      },
    });
  }

  async findAll() {
    return this.prisma.workflowDefinition.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllInitiable(userRoles: string[], department?: string) {
    const roles = await this.prisma.role.findMany({
      where: { name: { in: userRoles } },
    });
    
    const canInitiateIds = new Set<string>();
    roles.forEach(r => {
      r.canInitiate.forEach(id => canInitiateIds.add(id));
    });

    const whereClause: any = {
      status: WorkflowStatus.PUBLISHED,
    };

    if (!canInitiateIds.has('*')) {
      whereClause.id = { in: Array.from(canInitiateIds) };
    }

    if (department) {
      whereClause.department = department;
    }

    return this.prisma.workflowDefinition.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const workflow = await this.prisma.workflowDefinition.findUnique({
      where: { id },
      include: {
        forms: true,
      },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    return workflow;
  }

  async update(id: string, updateWorkflowDto: UpdateWorkflowDto) {
    await this.findOne(id);

    return this.prisma.workflowDefinition.update({
      where: { id },
      data: {
        name: updateWorkflowDto.name,
        description: updateWorkflowDto.description,
        graph: updateWorkflowDto.graph,
      },
    });
  }

  async publish(id: string) {
    return this.prisma.$transaction(async (prisma) => {
      const workflow = await prisma.workflowDefinition.findUnique({
        where: { id },
      });

      if (!workflow) {
        throw new NotFoundException(`Workflow with ID ${id} not found`);
      }

      const graph = workflow.graph as { nodes?: GraphNode[]; edges?: GraphEdge[] } | null;
      const nodes = graph?.nodes || [];
      const edges = graph?.edges || [];

      const endNodes = nodes.filter(n => n.type.toLowerCase() === 'end');
      if (endNodes.length !== 1) {
        throw new BadRequestException('Graph must have exactly one End node.');
      }

      const hasIncoming = new Set(edges.map(e => e.target));
      const hasOutgoing = new Set(edges.map(e => e.source));

      // Logical Start nodes are those with no incoming edges
      const startNodes = nodes.filter(node => !hasIncoming.has(node.id));
      if (startNodes.length === 0) {
        throw new BadRequestException('Graph must have at least one starting node (no incoming edges).');
      }
      if (startNodes.length > 1) {
        throw new BadRequestException('Graph has multiple starting nodes. Only one start point is allowed.');
      }

      for (const node of nodes) {
        const isStart = !hasIncoming.has(node.id);
        const isEnd = node.type.toLowerCase() === 'end';

        if (!isStart && !hasIncoming.has(node.id)) {
          throw new BadRequestException(`Node ${node.id} is disconnected (no incoming edges)`);
        }
        if (!isEnd && !hasOutgoing.has(node.id)) {
          throw new BadRequestException(`Node ${node.id} (${node.data?.name || node.type}) is disconnected (no outgoing edges)`);
        }
      }

      const formNodes = nodes.filter(n => n.type.toLowerCase() === 'form');
      for (const formNode of formNodes) {
        const existingForm = await prisma.formDefinition.findUnique({
          where: {
            definitionId_stepId: {
              definitionId: id,
              stepId: formNode.id,
            },
          },
        });

        if (existingForm) {
          await prisma.formDefinition.update({
            where: { id: existingForm.id },
            data: { fields: formNode.fields || {} },
          });
        } else {
          await prisma.formDefinition.create({
            data: {
              definitionId: id,
              stepId: formNode.id,
              fields: formNode.fields || {},
            },
          });
        }
      }

      return prisma.workflowDefinition.update({
        where: { id },
        data: {
          status: WorkflowStatus.PUBLISHED,
          version: { increment: 1 },
        },
      });
    });
  }

  async archive(id: string) {
    return this.prisma.workflowDefinition.update({
      where: { id },
      data: { status: WorkflowStatus.ARCHIVED },
    });
  }
}
