export interface Bug {
  id: string;
  name: string;
  description: string;
  bug_url?: string;
  screenshot_url?: string;
  status: BugStatus;
  priority: BugPriority;
  position: number;
  product_id: string;
  created_at: string;
  updated_at: string;
}

export type BugStatus = 
  | 'not_started'
  | 'in_progress'
  | 'completed';

export type BugPriority = 
  | 'must-have'
  | 'nice-to-have'
  | 'not-prioritized';

export interface BugRelationship {
  id: string;
  bug_id: string;
  affected_item_id: string;
  created_at: string;
}

export interface BugWithRelationships extends Bug {
  affected_items: Array<{
    id: string;
    name: string;
    type: 'feature' | 'page';
  }>;
} 