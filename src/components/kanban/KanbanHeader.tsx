import React from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KanbanFilters } from './KanbanFilters';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

interface KanbanHeaderProps {
  filters: {
    types: Set<string>;
    priorities: Set<string>;
  };
  onTypeFilterChange: (type: string) => void;
  onPriorityFilterChange: (priority: string) => void;
  onClearFilters: () => void;
  activeFilters: number;
}

export function KanbanHeader({
  filters,
  onTypeFilterChange,
  onPriorityFilterChange,
  onClearFilters,
  activeFilters
}: KanbanHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
      <KanbanFilters
        filters={filters}
        onTypeFilterChange={onTypeFilterChange}
        onPriorityFilterChange={onPriorityFilterChange}
        onClearFilters={onClearFilters}
        activeFilters={activeFilters}
      />
    </div>
  );
}