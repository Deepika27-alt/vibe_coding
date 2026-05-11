import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seed ---');
  
  console.log('Step 1: Cleaning up existing data...');
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

  console.log('Step 2: Creating roles...');
  const adminRole = await prisma.role.create({
    data: {
      name: 'ADMIN',
      description: 'Platform Administrator with full access',
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
  console.log('   Roles created.');

  console.log('Step 3: Creating users...');
  const salt = await bcrypt.genSalt();
  const passwordHash = await bcrypt.hash('Password123!', salt);

  // 1. Platform Admin
  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'System Admin',
      department: 'IT',
      passwordHash,
      roles: {
        create: {
          roleId: adminRole.id,
        },
      },
    },
  });

  // 2. Operations Manager
  await prisma.user.create({
    data: {
      email: 'manager@example.com',
      name: 'John Manager',
      department: 'Operations',
      passwordHash,
      roles: {
        create: {
          roleId: managerRole.id,
        },
      },
    },
  });

  // 3. HR Representative
  await prisma.user.create({
    data: {
      email: 'hr@example.com',
      name: 'Sarah HR',
      department: 'HR',
      passwordHash,
      roles: {
        create: {
          roleId: userRole.id,
        },
      },
    },
  });

  // 4. Finance User
  await prisma.user.create({
    data: {
      email: 'finance@example.com',
      name: 'Michael Finance',
      department: 'Finance',
      passwordHash,
      roles: {
        create: {
          roleId: userRole.id,
        },
      },
    },
  });

  // 5. Standard Employee
  await prisma.user.create({
    data: {
      email: 'user@example.com',
      name: 'Employee One',
      department: 'Sales',
      passwordHash,
      roles: {
        create: {
          roleId: userRole.id,
        },
      },
    },
  });

  // 6. Sample Workflow (Employee Onboarding)
  const onboardingWorkflow = await prisma.workflowDefinition.create({
    data: {
      name: 'Employee Onboarding',
      description: 'Standard process for new hire onboarding',
      department: 'HR',
      status: 'PUBLISHED',
      version: 1,
      graph: {
        nodes: [
          { id: 'start', type: 'start', data: { label: 'Start' }, position: { x: 250, y: 5 } },
          { id: 'form1', type: 'form', data: { label: 'Employee Details' }, position: { x: 250, y: 100 } },
          { id: 'approve1', type: 'approval', data: { label: 'Manager Approval' }, position: { x: 250, y: 200 } },
          { id: 'end', type: 'end', data: { label: 'End' }, position: { x: 250, y: 300 } },
        ],
        edges: [
          { id: 'e1-2', source: 'start', target: 'form1' },
          { id: 'e2-3', source: 'form1', target: 'approve1' },
          { id: 'e3-4', source: 'approve1', target: 'end' },
        ],
      },
      createdById: (await prisma.user.findUnique({ where: { email: 'admin@example.com' } }))!.id,
    },
  });

  // Create Form Definition for the form step
  await prisma.formDefinition.create({
    data: {
      definitionId: onboardingWorkflow.id,
      stepId: 'form1',
      fields: [
        { name: 'firstName', label: 'First Name', type: 'text', required: true },
        { name: 'lastName', label: 'Last Name', type: 'text', required: true },
        { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      ],
    },
  });

  console.log('   Sample workflow created.');
  console.log('--- Seed completed successfully ---');
  console.log('Admin: admin@example.com / Password123!');
  console.log('Manager: manager@example.com / Password123!');
  console.log('User: user@example.com / Password123!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

