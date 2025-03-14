export type TaskStatus = 'not_started' | 'in_progress' | 'completed';
export type TaskPriority = 'must-have' | 'nice-to-have' | 'not-prioritized';

export interface Task {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  product_id: string;
  created_at: string;
  updated_at: string;
} 