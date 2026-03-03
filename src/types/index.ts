export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  username: string;
  password: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string;
  department: string;
  signedContractAt?: string;
  employmentType?: string;
  contractStartDate?: string;
  contractPdfUrl?: string;
}

export interface WorkItem {
  id: string;
  content: string;
  status: 'pending' | 'processing' | 'completed';
}

export interface WorkLog {
  id: string;
  userId: string;
  date: string;
  workItems: WorkItem[];
  response: string;
  supervisorReply?: string;
  supervisorReplyAt?: string;
  problems: string;
  createdAt: string;
  updatedAt: string;
}

export type WorkLogFormData = Omit<WorkLog, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

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

export interface TaskAttachmentFile {
  name: string;
  size: number;
  type: string;
  data?: string;
  url?: string;
}

export interface TaskResponse {
  id: string;
  content: string;
  by: string;
  byName: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  source: string;
  attachment?: string;
  attachmentFile?: TaskAttachmentFile;
  assignedTo: string[];
  responses: TaskResponse[];
  completionDate: string;
  status: 'pending' | 'processing' | 'completed';
  createdAt: string;
  updatedAt: string;
  addResponse?: TaskResponse;
  response?: string;
  responseBy?: string;
}

export type TaskFormData = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'addResponse'> & { responses?: TaskResponse[] };
