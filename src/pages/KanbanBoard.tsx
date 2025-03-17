import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KanbanHeader } from '@/components/kanban/KanbanHeader';
import { KanbanBoard as KanbanBoardComponent } from '@/components/kanban/KanbanBoard';
import { KanbanDialog } from '@/components/kanban/KanbanDialog';
import { useKanban } from '@/hooks/useKanban';
import { PageHeader } from '@/components/PageHeader';

interface KanbanItem {
  id: string;
  name: string;
  description?: string;
  priority?: string;
  implementation_status?: string;
  status?: string;
  position?: number;
  type?: 'feature' | 'page' | 'bug' | 'task';
}

interface KanbanFormData {
  name: string;
  description: string;
  priority: 'must-have' | 'nice-to-have' | 'not-prioritized';
}

export function KanbanBoard() {
  const {
    items,
    loading,
    error,
    filters,
    activeFilters,
    onTypeFilterChange,
    onPriorityFilterChange,
    onClearFilters,
    addItem,
    updateItem,
    deleteItem,
  } = useKanban();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'feature' | 'page' | 'bug' | 'task'>('feature');

  const handleAddItem = (type: 'feature' | 'page' | 'bug' | 'task') => {
    setDialogType(type);
    setIsAddDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin rounded-full border-4 border-brand-purple border-t-transparent" />
          <p className="text-gray-600 mt-4">Loading development board...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Development"
        description="Track and manage your product development tasks"
      >
        <div className="flex items-center gap-3">
          <Button onClick={() => handleAddItem('feature')} variant="secondary" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Feature
          </Button>
          <Button onClick={() => handleAddItem('page')} variant="secondary" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Page
          </Button>
          <Button onClick={() => handleAddItem('bug')} variant="secondary" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Bug
          </Button>
          <Button onClick={() => handleAddItem('task')} variant="secondary" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Task
          </Button>
        </div>
      </PageHeader>

      <KanbanHeader
        filters={filters}
        onTypeFilterChange={onTypeFilterChange}
        onPriorityFilterChange={onPriorityFilterChange}
        onClearFilters={onClearFilters}
        activeFilters={activeFilters}
      />

      <KanbanBoardComponent
        items={items}
        loading={loading}
        onUpdateItem={updateItem}
        onDeleteItem={deleteItem}
      />

      <KanbanDialog
        type={dialogType}
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={(data: KanbanFormData) => {
          addItem({ ...data, type: dialogType });
          setIsAddDialogOpen(false);
        }}
      />
    </div>
  );
}