import api from './axios';

export interface AuditEvent {
  id: string;
  instanceId: string | null;
  actorId: string;
  action: string;
  stepId: string | null;
  snapshot: any;
  note: string | null;
  createdAt: string;
  instance?: {
    definition: {
      name: string;
    };
  };
  actor: {
    name: string;
    email: string;
  };
}

export const getAuditPreview = async (from: string, to: string, workflowId?: string): Promise<AuditEvent[]> => {
  const params: any = { from, to };
  if (workflowId && workflowId !== 'all') params.workflowId = workflowId;
  
  const response = await api.get('/admin/audit/preview', { params });
  return response.data;
};

export const exportAuditLogs = async (from: string, to: string, format: 'csv' | 'json', workflowId?: string) => {
  const params: any = { from, to, format };
  if (workflowId && workflowId !== 'all') params.workflowId = workflowId;
  
  const response = await api.get('/admin/audit/export', { 
    params,
    responseType: 'blob'
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `audit-log-\${new Date().toISOString().split('T')[0]}.\${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
