import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Database Reset and Admin Creation ---');

  console.log('Step 1: Cleaning up ALL existing data...');
  // Delete in order to respect foreign key constraints
  await prisma.taskEscalation.deleteMany();
  await prisma.task.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.flowInstance.deleteMany();
  await prisma.formDefinition.deleteMany();
  await prisma.workflowDefinition.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  console.log('   Cleanup complete.');

  console.log('Step 2: Creating Admin Role...');
  const adminRole = await prisma.role.create({
    data: {
      name: 'ADMIN',
      description: 'System Administrator with full access',
      canInitiate: ['*'],
      canAction: ['*'],
    },
  });

  const managerRole = await prisma.role.create({
    data: {
      name: 'MANAGER',
      description: 'Department Manager with approval authority',
      canInitiate: ['*'],
      canAction: ['*'],
    },
  });

  const userRole = await prisma.role.create({
    data: {
      name: 'USER',
      description: 'Standard User for initiating requests',
      canInitiate: ['*'],
    },
  });
  console.log('   Roles recreated.');

  console.log('Step 3: Creating New Admin User...');
  const salt = await bcrypt.genSalt();
  const passwordHash = await bcrypt.hash('Admin@123', salt);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@system.com',
      name: 'Primary Admin',
      department: 'Administration',
      passwordHash,
      roles: {
        create: {
          roleId: adminRole.id,
        },
      },
    },
  });

  console.log('   Admin user created.');
  console.log('------------------------------------------');
  console.log('Credentials:');
  console.log('Email:    admin@system.com');
  console.log('Password: Admin@123');
  console.log('------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Error resetting database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
