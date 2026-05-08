export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  roles: { role: Role }[];
  status: 'active' | 'inactive';
  lastLogin?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  workflows?: string[]; // IDs of workflows
  stepTypes?: string[]; // 'form' | 'approval' | 'manual'
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
}

export interface SystemSettings {
  email: {
    smtpHost: string;
    smtpPort: number;
    fromAddress: string;
  };
  notifications: {
    [key: string]: boolean; // eventType: enabled
  };
  branding: {
    companyName: string;
    logoUrl?: string;
  };
}
