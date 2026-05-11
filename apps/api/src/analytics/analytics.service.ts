import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FlowInstanceStatus, TaskStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview(from: Date, to: Date) {
    const [
      totalInstances,
      activeInstances,
      completedToday,
      completedInRange,
      tasksInRange,
    ] = await Promise.all([
      this.prisma.flowInstance.count({
        where: { createdAt: { gte: from, lte: to } },
      }),
      this.prisma.flowInstance.count({
        where: { status: FlowInstanceStatus.ACTIVE },
      }),
      this.prisma.flowInstance.count({
        where: {
          status: FlowInstanceStatus.COMPLETED,
          updatedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.flowInstance.findMany({
        where: {
          status: FlowInstanceStatus.COMPLETED,
          createdAt: { gte: from, lte: to },
        },
        select: {
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.task.findMany({
        where: {
          createdAt: { gte: from, lte: to },
          dueAt: { not: null },
        },
        select: {
          dueAt: true,
          completedAt: true,
          status: true,
        },
      }),
    ]);

    const totalCycleTime = completedInRange.reduce((acc, curr) => {
      return acc + (curr.updatedAt.getTime() - curr.createdAt.getTime());
    }, 0);

    const avgCycleTimeHours = completedInRange.length > 0 
      ? totalCycleTime / completedInRange.length / (1000 * 60 * 60)
      : 0;

    const breachedTasks = tasksInRange.filter(t => {
      if (!t.dueAt) return false;
      if (t.completedAt) {
        return t.completedAt > t.dueAt;
      }
      return new Date() > t.dueAt;
    });

    const slaBreachRate = tasksInRange.length > 0
      ? (breachedTasks.length / tasksInRange.length) * 100
      : 0;

    // Completions per day
    const completionsByDay: Record<string, number> = {};
    completedInRange.forEach(i => {
      const day = i.updatedAt.toISOString().split('T')[0];
      completionsByDay[day] = (completionsByDay[day] || 0) + 1;
    });

    const completionData = Object.entries(completionsByDay).map(([date, count]) => ({
      date,
      count,
    })).sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalInstances,
      activeInstances,
      completedToday,
      avgCycleTimeHours,
      slaBreachRate,
      completionsPerDay: completionData,
    };
  }

  async getWorkflowStats(from: Date, to: Date) {
    const workflows = await this.prisma.workflowDefinition.findMany({
      include: {
        instances: {
          where: { createdAt: { gte: from, lte: to } },
          include: {
            tasks: {
              where: { dueAt: { not: null } }
            }
          }
        }
      }
    });

    return workflows.map(wf => {
      const totalRuns = wf.instances.length;
      const completedRuns = wf.instances.filter(i => i.status === FlowInstanceStatus.COMPLETED);
      const completionRate = totalRuns > 0 ? (completedRuns.length / totalRuns) * 100 : 0;

      const cycleTimes = completedRuns.map(i => i.updatedAt.getTime() - i.createdAt.getTime());
      const avgCycleTimeHours = cycleTimes.length > 0
        ? cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length / (1000 * 60 * 60)
        : 0;

      const allTasks = wf.instances.flatMap(i => i.tasks);
      const breachedTasks = allTasks.filter(t => {
        if (!t.dueAt) return false;
        if (t.completedAt) return t.completedAt > t.dueAt;
        return new Date() > t.dueAt;
      });

      const slaBreachRate = allTasks.length > 0
        ? (breachedTasks.length / allTasks.length) * 100
        : 0;

      return {
        workflowId: wf.id,
        name: wf.name,
        totalRuns,
        completionRate,
        avgCycleTimeHours,
        slaBreachRate,
      };
    });
  }

  async getStepStats(from: Date, to: Date) {
    // This is more complex because we need to aggregate across instances
    const tasks = await this.prisma.task.findMany({
      where: {
        createdAt: { gte: from, lte: to },
      },
      include: {
        instance: {
          select: {
            definitionId: true
          }
        }
      }
    });

    // Group by workflowId and stepId
    const groups: Record<string, {
      workflowId: string;
      stepId: string;
      times: number[];
      breachCount: number;
    }> = {};

    tasks.forEach(t => {
      const key = `${t.instance.definitionId}-${t.stepId}`;
      if (!groups[key]) {
        groups[key] = {
          workflowId: t.instance.definitionId,
          stepId: t.stepId,
          times: [],
          breachCount: 0,
        };
      }

      if (t.completedAt) {
        groups[key].times.push(t.completedAt.getTime() - t.createdAt.getTime());
        if (t.dueAt && t.completedAt > t.dueAt) {
          groups[key].breachCount++;
        }
      } else if (t.dueAt && new Date() > t.dueAt) {
        groups[key].breachCount++;
      }
    });

    const stats = Object.values(groups).map(g => ({
      workflowId: g.workflowId,
      stepId: g.stepId,
      stepName: g.stepId, // We might want to resolve this from the graph later
      avgTimeHours: g.times.length > 0 
        ? (g.times.reduce((a, b) => a + b, 0) / g.times.length) / (1000 * 60 * 60)
        : 0,
      breachCount: g.breachCount,
    }));

    return stats
      .sort((a, b) => b.avgTimeHours - a.avgTimeHours)
      .slice(0, 5);
  }
}
