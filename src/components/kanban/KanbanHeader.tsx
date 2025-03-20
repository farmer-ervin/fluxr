import React from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KanbanFilters } from './KanbanFilters';
import { SearchInput } from '@/components/SearchInput';
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
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function KanbanHeader({
  filters,
  onTypeFilterChange,
  onPriorityFilterChange,
  onClearFilters,
  activeFilters,
  searchQuery,
  onSearchChange
}: KanbanHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center w-full">
        <KanbanFilters
          filters={filters}
          onTypeFilterChange={onTypeFilterChange}
          onPriorityFilterChange={onPriorityFilterChange}
          onClearFilters={onClearFilters}
          activeFilters={activeFilters}
        />
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          className="sm:w-72"
        />
      </div>
    </div>
  );
}