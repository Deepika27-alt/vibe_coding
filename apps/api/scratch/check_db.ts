
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const workflows = await prisma.workflowDefinition.findMany();
  console.log('--- Workflows ---');
  console.log(JSON.stringify(workflows, null, 2));

  const users = await prisma.user.findMany({
    include: { roles: true }
  });
  console.log('--- Users ---');
  console.log(JSON.stringify(users, null, 2));

  const instances = await prisma.flowInstance.findMany();
  console.log('--- Instances ---');
  console.log(JSON.stringify(instances, null, 2));

  const tasks = await prisma.task.findMany();
  console.log('--- Tasks ---');
  console.log(JSON.stringify(tasks, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
