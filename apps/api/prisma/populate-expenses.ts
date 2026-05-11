import { PrismaClient, TaskType, TaskStatus, FlowInstanceStatus, WorkflowStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Populating Expense Reimbursement Workflow ---');

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

  // 3. Create Expense Reimbursement Workflow
  console.log('Creating "Expense Reimbursement" workflow...');
  const expenseWorkflow = await prisma.workflowDefinition.create({
    data: {
      name: 'Expense Reimbursement',
      description: 'Submit and approve business-related expenses',
      department: 'Finance',
      status: WorkflowStatus.PUBLISHED,
      version: 1,
      graph: {
        nodes: [
          { id: 'start', type: 'start', data: { label: 'Start' }, position: { x: 250, y: 0 } },
          { id: 'details', type: 'form', data: { label: 'Expense Details', assigneeType: 'role', assigneeId: userRole.id }, position: { x: 250, y: 100 } },
          { id: 'approval', type: 'approval', data: { label: 'Manager Approval', assigneeType: 'role', assigneeId: managerRole.id }, position: { x: 250, y: 200 } },
          { id: 'payment', type: 'manual', data: { label: 'Finance Processing', assigneeType: 'role', assigneeId: adminRole.id }, position: { x: 250, y: 300 } },
          { id: 'end', type: 'end', data: { label: 'End' }, position: { x: 250, y: 400 } },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'details' },
          { id: 'e2', source: 'details', target: 'approval' },
          { id: 'e3', source: 'approval', target: 'payment' },
          { id: 'e4', source: 'payment', target: 'end' },
        ],
      },
      createdById: adminUser.id,
    },
  });

  // 4. Create Form Definition
  await prisma.formDefinition.create({
    data: {
      definitionId: expenseWorkflow.id,
      stepId: 'details',
      fields: [
        { id: 'amount', label: 'Amount ($)', type: 'number', required: true },
        { id: 'category', label: 'Category', type: 'dropdown', options: ['Travel', 'Meals', 'Software', 'Hardware', 'Other'], required: true },
        { id: 'date', label: 'Date of Expense', type: 'date', required: true },
        { id: 'justification', label: 'Justification', type: 'textarea', required: true },
      ],
    },
  });

  // 5. Create a Flow Instance
  console.log('Creating flow instance...');
  const flowInstance = await prisma.flowInstance.create({
    data: {
      definitionId: expenseWorkflow.id,
      definitionVersion: 1,
      status: FlowInstanceStatus.ACTIVE,
      currentStepId: 'approval',
      data: { amount: 450, category: 'Travel', justification: 'Flight for conference' },
      initiatedById: hrUser.id,
    },
  });

  // 6. Assign tasks
  console.log('Assigning tasks...');
  
  // Manager gets the Approval task
  await prisma.task.create({
    data: {
      instanceId: flowInstance.id,
      stepId: 'approval',
      type: TaskType.APPROVAL,
      assignedToId: managerUser.id,
      status: TaskStatus.PENDING,
      dueAt: new Date(Date.now() + 86400000 * 2), // 2 days
    }
  });

  // Admin gets the Payment task
  await prisma.task.create({
    data: {
      instanceId: flowInstance.id,
      stepId: 'payment',
      type: TaskType.MANUAL,
      assignedToId: adminUser.id,
      status: TaskStatus.PENDING,
      dueAt: new Date(Date.now() + 86400000 * 5),
    }
  });

  // HR gets a Details task (Role based)
  await prisma.task.create({
    data: {
      instanceId: flowInstance.id,
      stepId: 'details',
      type: TaskType.FORM,
      assignedRoleId: userRole.id,
      status: TaskStatus.PENDING,
      dueAt: new Date(Date.now() + 86400000),
    }
  });

  // Employee gets an Approval task (assigned to specific user to test)
  await prisma.task.create({
    data: {
      instanceId: flowInstance.id,
      stepId: 'approval',
      type: TaskType.APPROVAL,
      assignedToId: employeeUser.id,
      status: TaskStatus.PENDING,
      dueAt: new Date(Date.now() + 86400000 * 3),
    }
  });

  console.log('--- Expense Reimbursement population complete ---');
}

main()
  .catch((e) => {
    console.error('Error populating Expenses:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
