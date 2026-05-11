
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({
    where: { id: '5e94731f-485a-416c-9e45-7f33fa20ee7e' }
  });
  console.log(user?.email);
}
main().finally(() => prisma.$disconnect());
