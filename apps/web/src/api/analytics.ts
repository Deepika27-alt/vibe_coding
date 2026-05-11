import axios from './axios';

export interface OverviewStats {
  totalInstances: number;
  activeInstances: number;
  completedToday: number;
  avgCycleTimeHours: number;
  slaBreachRate: number;
  completionsPerDay: { date: string; count: number }[];
}

export interface WorkflowStats {
  workflowId: string;
  name: string;
  totalRuns: number;
  completionRate: number;
  avgCycleTimeHours: number;
  slaBreachRate: number;
}

export interface StepStats {
  workflowId: string;
  stepId: string;
  stepName: string;
  avgTimeHours: number;
  breachCount: number;
}

export const getOverview = async (from?: string, to?: string) => {
  const response = await axios.get<OverviewStats>('/analytics/overview', {
    params: { from, to },
  });
  return response.data;
};

export const getWorkflowStats = async (from?: string, to?: string) => {
  const response = await axios.get<WorkflowStats[]>('/analytics/workflows', {
    params: { from, to },
  });
  return response.data;
};

export const getStepStats = async (from?: string, to?: string) => {
  const response = await axios.get<StepStats[]>('/analytics/steps', {
    params: { from, to },
  });
  return response.data;
};
