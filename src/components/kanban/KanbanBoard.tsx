import React from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { KanbanColumn } from './KanbanColumn';

export const COLUMNS = [
  { id: 'not_started', title: 'Not Started', color: 'bg-gray-100 border-gray-200 border' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-50 border-blue-200 border' },
  { id: 'completed', title: 'Completed', color: 'bg-green-50 border-green-200 border' }
];

interface Item {
  id: string;
  name: string;
  description?: string;
  priority?: string;
  implementation_status: string;
  position?: number;
  type?: 'feature' | 'page' | 'bug' | 'task';
}

interface KanbanBoardProps {
  items: Item[];
  loading: boolean;
  onUpdateItem: (itemId: string, updates: Partial<Item>) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onDragEnd: (result: any) => Promise<void>;
}

export function KanbanBoard({ items, loading, onUpdateItem, onDeleteItem, onDragEnd }: KanbanBoardProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin rounded-full border-4 border-brand-purple border-t-transparent" />
          <p className="text-gray-600 mt-4">Loading board...</p>
        </div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 overflow-x-auto">
        {COLUMNS.map((column) => (
          <div 
            key={column.id} 
            className={`${column.color} rounded-lg shadow-md p-4 mb-4 lg:mb-0 flex-1 flex flex-col w-full lg:w-80 lg:flex-shrink-0`}
          >
            <KanbanColumn
              title={column.title}
              droppableId={column.id}
              items={items.filter(item => item.implementation_status === column.id)}
              onFeatureStatusChange={(featureId, newStatus) => 
                onUpdateItem(featureId, { implementation_status: newStatus })
              }
              onPageStatusChange={(pageId, newStatus) => 
                onUpdateItem(pageId, { implementation_status: newStatus })
              }
              onBugStatusChange={(bugId, newStatus) => 
                onUpdateItem(bugId, { implementation_status: newStatus })
              }
              onTaskStatusChange={(taskId, newStatus) => 
                onUpdateItem(taskId, { implementation_status: newStatus })
              }
              onDeleteFeature={onDeleteItem}
              onDeletePage={onDeleteItem}
              onDeleteBug={onDeleteItem}
              onDeleteTask={onDeleteItem}
            />
          </div>
        ))}
      </div>
    </DragDropContext>
  );
} 