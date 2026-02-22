import type { WorkLog, Contract, Task } from '../types';
import { defaultWorkLogs, defaultContract, defaultTasks } from '../data/mockData';

const WORK_LOGS_KEY = 'employee_work_logs';
const CONTRACT_KEY = 'employee_contract';
const TASKS_KEY = 'employee_tasks';

export function getWorkLogs(): WorkLog[] {
  const stored = localStorage.getItem(WORK_LOGS_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(WORK_LOGS_KEY, JSON.stringify(defaultWorkLogs));
  return defaultWorkLogs;
}

export function saveWorkLogs(logs: WorkLog[]): void {
  localStorage.setItem(WORK_LOGS_KEY, JSON.stringify(logs));
}

export function getContract(): Contract {
  const stored = localStorage.getItem(CONTRACT_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(CONTRACT_KEY, JSON.stringify(defaultContract));
  return defaultContract;
}

export function saveContract(contract: Contract): void {
  localStorage.setItem(CONTRACT_KEY, JSON.stringify(contract));
}

export function getTasks(): Task[] {
  const stored = localStorage.getItem(TASKS_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(TASKS_KEY, JSON.stringify(defaultTasks));
  return defaultTasks;
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
