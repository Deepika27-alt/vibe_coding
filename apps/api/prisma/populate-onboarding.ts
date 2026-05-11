import { PrismaClient, TaskType, TaskStatus, FlowInstanceStatus, WorkflowStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Populating Employee Onboarding Workflow ---');

  // 1. Get or Create Roles (they should exist from reset-db.ts)
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  const managerRole = await prisma.role.findUnique({ where: { name: 'MANAGER' } });
  const userRole = await prisma.role.findUnique({ where: { name: 'USER' } });

  if (!adminRole || !managerRole || !userRole) {
    console.error('Roles not found. Please run reset-db.ts first.');
    return;
  }

  // 2. Create more users to have a diverse set
  const salt = await bcrypt.genSalt();
  const passwordHash = await bcrypt.hash('Admin@123', salt);

  console.log('Creating additional users...');
  const users = [
    { email: 'manager@system.com', name: 'Dept Manager', dept: 'Operations', roleId: managerRole.id },
    { email: 'hr@system.com', name: 'HR Specialist', dept: 'Human Resources', roleId: userRole.id },
    { email: 'employee@system.com', name: 'New Employee', dept: 'Engineering', roleId: userRole.id },
  ];

  for (const u of users) {
    const roleIds = Array.from(new Set([u.roleId, userRole.id]));
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        department: u.dept,
        passwordHash,
        roles: {
          create: roleIds.map(id => ({ roleId: id })),
        },
      },
    });
  }

  const allUsers = await prisma.user.findMany();
  const adminUser = allUsers.find(u => u.email === 'admin@system.com')!;

  // 3. Create Workflow Definition
  console.log('Creating "Employee Onboarding" workflow...');
  const onboardingWorkflow = await prisma.workflowDefinition.create({
    data: {
      name: 'Employee Onboarding',
      description: 'Comprehensive process for onboarding new team members',
      department: 'HR',
      status: WorkflowStatus.PUBLISHED,
      version: 1,
      graph: {
        nodes: [
          { id: 'start', type: 'start', data: { label: 'Start' }, position: { x: 250, y: 0 } },
          { id: 'personal_info', type: 'form', data: { label: 'Personal Information', assigneeType: 'role', assigneeId: userRole.id }, position: { x: 250, y: 100 } },
          { id: 'it_setup', type: 'manual', data: { label: 'IT Assets Setup', assigneeType: 'role', assigneeId: managerRole.id }, position: { x: 250, y: 200 } },
          { id: 'manager_review', type: 'approval', data: { label: 'Manager Review', assigneeType: 'role', assigneeId: managerRole.id }, position: { x: 250, y: 300 } },
          { id: 'end', type: 'end', data: { label: 'End' }, position: { x: 250, y: 400 } },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'personal_info' },
          { id: 'e2', source: 'personal_info', target: 'it_setup' },
          { id: 'e3', source: 'it_setup', target: 'manager_review' },
          { id: 'e4', source: 'manager_review', target: 'end' },
        ],
      },
      createdById: adminUser.id,
    },
  });

  // 4. Create Form Definition for the first step
  await prisma.formDefinition.create({
    data: {
      definitionId: onboardingWorkflow.id,
      stepId: 'personal_info',
      fields: [
        { id: 'fullName', label: 'Full Name', type: 'text', required: true },
        { id: 'address', label: 'Residential Address', type: 'textarea', required: true },
        { id: 'phone', label: 'Phone Number', type: 'text', required: true },
      ],
    },
  });

  // 5. Create a Flow Instance
  console.log('Creating flow instance...');
  const flowInstance = await prisma.flowInstance.create({
    data: {
      definitionId: onboardingWorkflow.id,
      definitionVersion: 1,
      status: FlowInstanceStatus.ACTIVE,
      currentStepId: 'personal_info',
      data: {},
      initiatedById: adminUser.id,
    },
  });

  // 6. Assign a task to EACH user
  console.log('Assigning tasks to all users...');
  const taskTypes = [TaskType.FORM, TaskType.MANUAL, TaskType.APPROVAL, TaskType.FORM];
  const stepIds = ['personal_info', 'it_setup', 'manager_review', 'personal_info'];

  for (let i = 0; i < allUsers.length; i++) {
    const user = allUsers[i];
    const type = taskTypes[i % taskTypes.length];
    const stepId = stepIds[i % stepIds.length];

    await prisma.task.create({
      data: {
        instanceId: flowInstance.id,
        stepId: stepId,
        type: type,
        assignedToId: user.id,
        status: TaskStatus.PENDING,
        dueAt: new Date(Date.now() + 86400000 * 2), // 2 days from now
      },
    });
    console.log(`   Task assigned to: ${user.email} (${type} on step ${stepId})`);
  }

  console.log('--- Population complete ---');
}

main()
  .catch((e) => {
    console.error('Error populating database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
