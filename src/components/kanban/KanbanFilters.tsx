import React from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export const CARD_TYPES = [
  { value: 'feature', label: 'Feature' },
  { value: 'page', label: 'Page' },
  { value: 'task', label: 'Task' },
  { value: 'bug', label: 'Bug' }
];

export const PRIORITIES = [
  { value: 'must-have', label: 'Must Have' },
  { value: 'nice-to-have', label: 'Nice to Have' },
  { value: 'not-prioritized', label: 'Not Prioritized' }
];

interface FilterState {
  types: Set<string>;
  priorities: Set<string>;
}

interface KanbanFiltersProps {
  filters: FilterState;
  onTypeFilterChange: (type: string) => void;
  onPriorityFilterChange: (priority: string) => void;
  onClearFilters: () => void;
  activeFilters: number;
}

export function KanbanFilters({
  filters,
  onTypeFilterChange,
  onPriorityFilterChange,
  onClearFilters,
  activeFilters
}: KanbanFiltersProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={activeFilters > 0 ? "border-brand-purple text-brand-purple" : ""}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {activeFilters > 0 && (
            <span className="ml-2 bg-brand-purple text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {activeFilters}
            </span>
          )}
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm font-semibold">Card Type</div>
        {CARD_TYPES.map(type => (
          <DropdownMenuCheckboxItem
            key={type.value}
            checked={filters.types.has(type.value)}
            onCheckedChange={() => onTypeFilterChange(type.value)}
          >
            {type.label}
          </DropdownMenuCheckboxItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5 text-sm font-semibold">Priority</div>
        {PRIORITIES.map(priority => (
          <DropdownMenuCheckboxItem
            key={priority.value}
            checked={filters.priorities.has(priority.value)}
            onCheckedChange={() => onPriorityFilterChange(priority.value)}
          >
            {priority.label}
          </DropdownMenuCheckboxItem>
        ))}
        
        {activeFilters > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-8"
                onClick={onClearFilters}
              >
                Clear Filters
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}