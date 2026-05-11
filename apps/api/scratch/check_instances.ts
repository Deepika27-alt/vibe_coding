
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const instances = await prisma.flowInstance.findMany({
    include: { tasks: true, definition: { select: { name: true } } }
  });
  console.log(JSON.stringify(instances, null, 2));
}
main().finally(() => prisma.$disconnect());
