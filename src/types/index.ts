export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  avatar: string;
  department: string;
  signedContractAt?: string;
}

export interface WorkLog {
  id: string;
  userId: string;
  date: string;
  task: string;
  response: string;
  supervisorReply?: string;
  supervisorReplyAt?: string;
  completionDate: string;
  timeSpent: string;
  problems: string;
  status: 'pending' | 'processing' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  title: string;
  content: string;
  version: number;
  updatedAt: string;
}

export interface ContractSignature {
  userId: string;
  signedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  source: 'client' | 'vendor';
  attachment?: string;
  assignedTo: string;
  response: string;
  completionDate: string;
  status: 'pending' | 'processing' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export type WorkLogFormData = Omit<WorkLog, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type TaskFormData = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;
