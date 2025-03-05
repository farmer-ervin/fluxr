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
  onAddFeature: () => void;
  onAddPage: () => void;
  onAddBug: () => void;
  onAddTask: () => void;
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
  onAddFeature,
  onAddPage,
  onAddBug,
  onAddTask,
  filters,
  onTypeFilterChange,
  onPriorityFilterChange,
  onClearFilters,
  activeFilters
}: KanbanHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <h1 className="text-2xl font-bold text-gray-900">Development</h1>

      <div className="flex items-center gap-3">
        <KanbanFilters
          filters={filters}
          onTypeFilterChange={onTypeFilterChange}
          onPriorityFilterChange={onPriorityFilterChange}
          onClearFilters={onClearFilters}
          activeFilters={activeFilters}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onAddFeature}>
              <div className="flex items-center gap-2">
                Feature
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAddPage}>
              <div className="flex items-center gap-2">
                Page
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAddBug}>
              <div className="flex items-center gap-2">
                Bug
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAddTask}>
              <div className="flex items-center gap-2">
                Task
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}