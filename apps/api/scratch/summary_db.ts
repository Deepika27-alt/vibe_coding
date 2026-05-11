
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const instancesCount = await prisma.flowInstance.count();
  const tasksCount = await prisma.task.count();
  const pendingTasks = await prisma.task.findMany({
    where: { status: 'PENDING' },
    include: { assignedTo: { select: { email: true } }, assignedRole: { select: { name: true } } }
  });

  console.log({
    totalInstances: instancesCount,
    totalTasks: tasksCount,
    pendingTasksSummary: pendingTasks.map(t => ({
      id: t.id,
      assignedTo: t.assignedTo?.email || 'N/A',
      assignedRole: t.assignedRole?.name || 'N/A'
    }))
  });
}
main().finally(() => prisma.$disconnect());
