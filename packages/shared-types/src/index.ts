export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
}

export interface WorkflowRequest {
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
