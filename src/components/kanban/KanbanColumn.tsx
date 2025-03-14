import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { KanbanCard } from './KanbanCard';
import { BugCard } from './BugCard';
import { TaskCard } from './TaskCard';
import { Task } from '@/types/task';
import { supabase } from '@/lib/supabase';

interface Item {
  id: string;
  name: string;
  description?: string;
  priority?: string;
  implementation_status?: string;
  status?: string;
  position?: number;
  type?: 'feature' | 'page' | 'bug' | 'task';
  bug_url?: string;
  screenshot_url?: string;
}

interface KanbanColumnProps {
  title: string;
  items?: Item[];
  droppableId: string;
  onFeatureStatusChange?: (featureId: string, newStatus: string) => void;
  onPageStatusChange?: (pageId: string, newStatus: string) => void;
  onBugStatusChange?: (bugId: string, newStatus: string) => void;
  onTaskStatusChange?: (taskId: string, newStatus: string) => void;
  onDeleteFeature?: (featureId: string) => void;
  onDeletePage?: (pageId: string) => void;
  onDeleteBug?: (bugId: string) => void;
  onDeleteTask?: (taskId: string) => void;
}

export function KanbanColumn({
  title,
  items = [],
  droppableId,
  onFeatureStatusChange,
  onPageStatusChange,
  onBugStatusChange,
  onTaskStatusChange,
  onDeleteFeature,
  onDeletePage,
  onDeleteBug,
  onDeleteTask
}: KanbanColumnProps) {
  const handleFeatureUpdate = async (featureId: string, updates: Partial<Item>) => {
    try {
      const { error } = await supabase
        .from('features')
        .update(updates)
        .eq('id', featureId);
      
      if (error) {
        console.error('Error updating feature:', error);
        throw new Error('Failed to update feature');
      }
      
      // If status is being updated, also call the status change handler
      if (updates.implementation_status && onFeatureStatusChange) {
        onFeatureStatusChange(featureId, updates.implementation_status);
      }
    } catch (error) {
      console.error('Error in handleFeatureUpdate:', error);
    }
  };

  const handlePageUpdate = async (pageId: string, updates: Partial<Item>) => {
    try {
      const { error } = await supabase
        .from('flow_pages')
        .update(updates)
        .eq('id', pageId);
      
      if (error) {
        console.error('Error updating page:', error);
        throw new Error('Failed to update page');
      }
      
      // If status is being updated, also call the status change handler
      if (updates.implementation_status && onPageStatusChange) {
        onPageStatusChange(pageId, updates.implementation_status);
      }
    } catch (error) {
      console.error('Error in handlePageUpdate:', error);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">{title}</h3>
        <span className="text-sm font-medium bg-white/50 px-2 py-1 rounded-full">
          {items?.length || 0}
        </span>
      </div>
      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-col gap-3 min-h-[200px] p-2 rounded-md transition-colors ${
              snapshot.isDraggingOver ? 'bg-white/30 border-2 border-dashed border-gray-300' : 'border-2 border-transparent'
            }`}
          >
            {items?.map((item, index) => (
              <Draggable
                key={item.id}
                draggableId={item.id}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      ...provided.draggableProps.style,
                    }}
                    className={`${snapshot.isDragging ? 'z-10' : ''}`}
                  >
                    {item.type === 'bug' ? (
                      <BugCard
                        bug={item}
                        index={index}
                        onStatusChange={onBugStatusChange}
                        onDelete={onDeleteBug}
                      />
                    ) : item.type === 'task' ? (
                      <TaskCard
                        task={item}
                        onStatusChange={onTaskStatusChange}
                        onDelete={onDeleteTask}
                      />
                    ) : item.type === 'page' ? (
                      <KanbanCard
                        feature={item}
                        index={index}
                        onUpdate={handlePageUpdate}
                      />
                    ) : (
                      <KanbanCard
                        feature={item}
                        index={index}
                        onUpdate={handleFeatureUpdate}
                      />
                    )}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}