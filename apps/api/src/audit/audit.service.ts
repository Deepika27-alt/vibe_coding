import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { stringify } from 'csv-stringify';
import { Readable } from 'stream';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async exportLogs(
    from: Date,
    to: Date,
    actorId: string,
    workflowId?: string,
    format: 'csv' | 'json' = 'csv',
  ) {
    const rangeDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
    if (rangeDays > 90) {
      throw new BadRequestException('Max date range is 90 days');
    }

    const where: any = {
      createdAt: { gte: from, lte: to },
    };
    if (workflowId) {
      where.instance = { definitionId: workflowId };
    }

    const count = await this.prisma.auditEvent.count({ where });
    if (count > 50000) {
      throw new BadRequestException(`Export exceeds max limit of 50,000 rows (found \${count})`);
    }

    // Log the export event
    const auditData: any = {
      action: (AuditAction as any).EXPORTED || 'EXPORTED',
      actorId,
      note: `Exported \${count} logs in \${format} format`,
    };

    await (this.prisma.auditEvent as any).create({
      data: auditData,
    });

    const events = await this.prisma.auditEvent.findMany({
      where,
      include: {
        instance: {
          include: {
            definition: true,
          },
        },
        actor: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedData = events.map((e) => ({
      timestamp: e.createdAt.toISOString(),
      instanceId: e.instanceId || 'N/A',
      workflowName: e.instance?.definition.name || 'N/A',
      workflowVersion: e.instance?.definitionVersion || 'N/A',
      actorEmail: e.actor.email,
      actorName: e.actor.name,
      action: e.action,
      stepId: e.stepId || 'N/A',
      note: e.note || '',
      snapshotSummary: e.snapshot ? Object.keys(e.snapshot as object).join(', ') : '',
    }));

    if (format === 'json') {
      return Readable.from(JSON.stringify(formattedData));
    }

    const columns = [
      'timestamp',
      'instanceId',
      'workflowName',
      'workflowVersion',
      'actorEmail',
      'actorName',
      'action',
      'stepId',
      'note',
      'snapshotSummary',
    ];

    const stringifier = stringify({ header: true, columns });
    return Readable.from(formattedData).pipe(stringifier);
  }

  async getPreview(from: Date, to: Date, workflowId?: string) {
    const where: any = {
      createdAt: { gte: from, lte: to },
    };
    if (workflowId) {
      where.instance = { definitionId: workflowId };
    }

    return this.prisma.auditEvent.findMany({
      where,
      include: {
        instance: {
          include: {
            definition: true,
          },
        },
        actor: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
