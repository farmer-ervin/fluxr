import { Feature } from '@/lib/database.types';

export const VALID_PRIORITIES = ['must-have', 'nice-to-have', 'not-prioritized'] as const;
export const VALID_STATUSES = ['not_started', 'in_progress', 'completed', 'blocked', 'deferred'] as const;

export type ValidPriority = typeof VALID_PRIORITIES[number];
export type ValidStatus = typeof VALID_STATUSES[number];

export interface RawFeature {
  name?: string;
  description?: string;
  priority?: string;
  implementation_status?: string;
}

export function normalizeFeature(feature: RawFeature, index: number): Partial<Feature> {
  // Normalize priority
  let priority: ValidPriority = 'not-prioritized';
  if (feature.priority) {
    const normalizedPriority = feature.priority.toLowerCase().replace(/\s+/g, '-');
    if (VALID_PRIORITIES.includes(normalizedPriority as ValidPriority)) {
      priority = normalizedPriority as ValidPriority;
    } else if (normalizedPriority.includes('must')) {
      priority = 'must-have';
    } else if (normalizedPriority.includes('nice')) {
      priority = 'nice-to-have';
    }
  }

  // Normalize implementation status
  let status: ValidStatus = 'not_started';
  if (feature.implementation_status) {
    const normalizedStatus = feature.implementation_status.toLowerCase().replace(/\s+/g, '_');
    if (VALID_STATUSES.includes(normalizedStatus as ValidStatus)) {
      status = normalizedStatus as ValidStatus;
    }
  }

  return {
    name: feature.name || `Untitled Feature ${index + 1}`,
    description: feature.description || '',
    priority,
    implementation_status: status,
    position: index * 1000 // Ensure proper spacing between features
  };
}