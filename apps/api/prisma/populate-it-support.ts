import { PrismaClient, TaskType, TaskStatus, FlowInstanceStatus, WorkflowStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Populating IT Support Request Workflow ---');

  // 1. Get Roles
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  const managerRole = await prisma.role.findUnique({ where: { name: 'MANAGER' } });
  const userRole = await prisma.role.findUnique({ where: { name: 'USER' } });

  if (!adminRole || !managerRole || !userRole) {
    console.error('Roles not found. Please run reset-db.ts first.');
    return;
  }

  // 2. Get Existing Users
  const allUsers = await prisma.user.findMany();
  const adminUser = allUsers.find(u => u.email === 'admin@system.com')!;
  const managerUser = allUsers.find(u => u.email === 'manager@system.com')!;
  const hrUser = allUsers.find(u => u.email === 'hr@system.com')!;
  const employeeUser = allUsers.find(u => u.email === 'employee@system.com')!;

  // 3. Create IT Support Workflow Definition
  console.log('Creating "IT Support Request" workflow...');
  const itSupportWorkflow = await prisma.workflowDefinition.create({
    data: {
      name: 'IT Support Request',
      description: 'Report and track technical issues',
      department: 'IT',
      status: WorkflowStatus.PUBLISHED,
      version: 1,
      graph: {
        nodes: [
          { id: 'start', type: 'start', data: { label: 'Start' }, position: { x: 250, y: 0 } },
          { id: 'report', type: 'form', data: { label: 'Issue Report', assigneeType: 'role', assigneeId: userRole.id }, position: { x: 250, y: 100 } },
          { id: 'triage', type: 'approval', data: { label: 'IT Triage', assigneeType: 'role', assigneeId: adminRole.id }, position: { x: 250, y: 200 } },
          { id: 'fix', type: 'manual', data: { label: 'Technical Fix', assigneeType: 'user', assigneeId: adminUser.id }, position: { x: 250, y: 300 } },
          { id: 'end', type: 'end', data: { label: 'End' }, position: { x: 250, y: 400 } },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'report' },
          { id: 'e2', source: 'report', target: 'triage' },
          { id: 'e3', source: 'triage', target: 'fix' },
          { id: 'e4', source: 'fix', target: 'end' },
        ],
      },
      createdById: adminUser.id,
    },
  });

  // 4. Create Form Definition
  await prisma.formDefinition.create({
    data: {
      definitionId: itSupportWorkflow.id,
      stepId: 'report',
      fields: [
        { id: 'subject', label: 'Issue Subject', type: 'text', required: true },
        { id: 'description', label: 'Detailed Description', type: 'textarea', required: true },
        { id: 'priority', label: 'Priority', type: 'dropdown', options: ['Low', 'Medium', 'High', 'Critical'], required: true },
      ],
    },
  });

  // 5. Create a Flow Instance
  console.log('Creating flow instance...');
  const flowInstance = await prisma.flowInstance.create({
    data: {
      definitionId: itSupportWorkflow.id,
      definitionVersion: 1,
      status: FlowInstanceStatus.ACTIVE,
      currentStepId: 'triage',
      data: { subject: 'Laptop not booting', priority: 'High' },
      initiatedById: employeeUser.id,
    },
  });

  // 6. Assign tasks to each user
  console.log('Assigning tasks to all users...');
  
  // Admin gets a Triage task
  await prisma.task.create({
    data: {
      instanceId: flowInstance.id,
      stepId: 'triage',
      type: TaskType.APPROVAL,
      assignedToId: adminUser.id,
      status: TaskStatus.PENDING,
      dueAt: new Date(Date.now() + 3600000 * 4), // 4 hours
    }
  });

  // Manager gets a Triage task (role-based)
  await prisma.task.create({
    data: {
      instanceId: flowInstance.id,
      stepId: 'triage',
      type: TaskType.APPROVAL,
      assignedRoleId: managerRole.id,
      status: TaskStatus.PENDING,
      dueAt: new Date(Date.now() + 3600000 * 8),
    }
  });

  // HR gets a Manual Fix task
  await prisma.task.create({
    data: {
      instanceId: flowInstance.id,
      stepId: 'fix',
      type: TaskType.MANUAL,
      assignedToId: hrUser.id,
      status: TaskStatus.PENDING,
      dueAt: new Date(Date.now() + 86400000),
    }
  });

  // Employee gets another Report task (maybe for clarification)
  await prisma.task.create({
    data: {
      instanceId: flowInstance.id,
      stepId: 'report',
      type: TaskType.FORM,
      assignedToId: employeeUser.id,
      status: TaskStatus.PENDING,
      dueAt: new Date(Date.now() + 86400000 * 2),
    }
  });

  console.log('--- IT Support Request population complete ---');
}

main()
  .catch((e) => {
    console.error('Error populating IT Support:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
