import { Node, Edge } from 'reactflow';

export type StepType = 'form' | 'task' | 'approval' | 'action' | 'condition' | 'end';

export type FieldType = 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'file' | 'rich-text';

export interface VisibilityCondition {
  fieldId: string;
  operator: 'equals' | 'not_equals' | 'is_filled';
  value?: any;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  
  // Dropdown specific
  options?: string[];
  
  // Number specific
  min?: number;
  max?: number;
  
  // Text specific
  maxLength?: number;
  regexPattern?: string;
  
  // File specific
  acceptedTypes?: string; // comma separated
  maxSizeMB?: number;
  
  // Conditional visibility
  visibilityCondition?: VisibilityCondition;
}

export interface FormDefinition {
  id: string;
  fields: FormField[];
}

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
  fields?: FormField[]; // Embedded fields for now
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
