import { 
  FileText, 
  CheckSquare, 
  CheckCircle2, 
  Zap, 
  GitBranch, 
  Flag,
  Play
} from 'lucide-react';
import { StepType, NodeConfig } from './types';

export const STEP_PALETTE = [
  { type: 'start', label: 'Start', icon: Play, color: '#059669' }, // emerald
  { type: 'form', label: 'Form', icon: FileText, color: '#3b82f6' }, // blue
  { type: 'task', label: 'Task', icon: CheckSquare, color: '#10b981' }, // green
  { type: 'approval', label: 'Approval', icon: CheckCircle2, color: '#f59e0b' }, // amber
  { type: 'action', label: 'Action', icon: Zap, color: '#8b5cf6' }, // purple
  { type: 'condition', label: 'Condition', icon: GitBranch, color: '#ec4899' }, // pink
  { type: 'end', label: 'End', icon: Flag, color: '#64748b' }, // slate
] as const;

export const NODE_TYPES = {
  start: 'start',
  form: 'form',
  task: 'task',
  approval: 'approval',
  action: 'action',
  condition: 'condition',
  end: 'end',
} as const;

export const DEFAULT_NODE_DATA: Record<StepType, NodeConfig> = {
  start: { name: 'Start', description: 'Entry point of the workflow' },
  form: { name: 'New Form', description: '', assigneeType: 'role' },
  task: { name: 'New Task', description: '', assigneeType: 'role' },
  approval: { name: 'New Approval', description: '', assigneeType: 'role' },
  action: { name: 'New Action', description: '', actionType: 'email' },
  condition: { name: 'New Condition', description: '', branches: ['True', 'False'] },
  end: { name: 'End', description: '' },
};
