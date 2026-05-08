import { Node, Edge } from 'reactflow';

export type StepType = 'form' | 'task' | 'approval' | 'action' | 'condition' | 'end';

export interface NodeConfig {
  name: string;
  description?: string;
  assigneeType?: 'role' | 'user';
  assigneeId?: string;
  sla?: number; // in hours
  escalationTarget?: string;
  
  // Action specific
  actionType?: 'email' | 'webhook' | 'api';
  actionConfig?: Record<string, any>;

  // Condition specific
  conditionField?: string;
  conditionOperator?: 'equals' | 'contains' | 'gt' | 'lt' | 'empty';
  conditionValue?: any;
  branches?: string[];

  // Form specific
  formId?: string;
}

export type WorkflowNode = Node<NodeConfig>;
export type WorkflowEdge = Edge;

export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  department: string;
  status: 'draft' | 'published';
  graph: WorkflowGraph;
  version: number;
}
