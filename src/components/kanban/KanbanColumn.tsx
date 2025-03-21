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
  implementation_status: string;
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
      // Only include fields that exist in the flow_pages table
      const validUpdates = {
        name: updates.name,
        description: updates.description,
        implementation_status: updates.implementation_status,
        position: updates.position,
        priority: updates.priority,
        updated_at: new Date().toISOString()
      };

      // Remove undefined fields
      Object.keys(validUpdates).forEach(key => {
        if (validUpdates[key as keyof typeof validUpdates] === undefined) {
          delete validUpdates[key as keyof typeof validUpdates];
        }
      });

      const { error } = await supabase
        .from('flow_pages')
        .update(validUpdates)
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

  const handleBugUpdate = async (bugId: string, updates: Partial<Item>) => {
    try {
      // Only include fields that exist in the bugs table
      const validUpdates = {
        name: updates.name,
        description: updates.description,
        implementation_status: updates.implementation_status,
        position: updates.position,
        priority: updates.priority,
        bug_url: updates.bug_url,
        screenshot_url: updates.screenshot_url,
        updated_at: new Date().toISOString()
      };

      // Remove undefined fields
      Object.keys(validUpdates).forEach(key => {
        if (validUpdates[key as keyof typeof validUpdates] === undefined) {
          delete validUpdates[key as keyof typeof validUpdates];
        }
      });

      const { error } = await supabase
        .from('bugs')
        .update(validUpdates)
        .eq('id', bugId);
      
      if (error) {
        console.error('Error updating bug:', error);
        throw new Error('Failed to update bug');
      }
      
      // If status is being updated, also call the status change handler
      if (updates.implementation_status && onBugStatusChange) {
        onBugStatusChange(bugId, updates.implementation_status);
      }
    } catch (error) {
      console.error('Error in handleBugUpdate:', error);
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Item>) => {
    try {
      // Only include fields that exist in the tasks table
      const validUpdates = {
        name: updates.name,
        description: updates.description,
        implementation_status: updates.implementation_status,
        position: updates.position,
        priority: updates.priority,
        updated_at: new Date().toISOString()
      };

      // Remove undefined fields
      Object.keys(validUpdates).forEach(key => {
        if (validUpdates[key as keyof typeof validUpdates] === undefined) {
          delete validUpdates[key as keyof typeof validUpdates];
        }
      });

      const { error } = await supabase
        .from('tasks')
        .update(validUpdates)
        .eq('id', taskId);
      
      if (error) {
        console.error('Error updating task:', error);
        throw new Error('Failed to update task');
      }
      
      // If status is being updated, also call the status change handler
      if (updates.implementation_status && onTaskStatusChange) {
        onTaskStatusChange(taskId, updates.implementation_status);
      }
    } catch (error) {
      console.error('Error in handleTaskUpdate:', error);
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
            className={`flex flex-col gap-3 flex-grow min-h-[200px] p-2 rounded-md transition-colors ${
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
                        onEdit={handleBugUpdate}
                      />
                    ) : item.type === 'task' ? (
                      <TaskCard
                        task={item}
                        index={index}
                        onStatusChange={onTaskStatusChange}
                        onDelete={onDeleteTask}
                        onEdit={handleTaskUpdate}
                      />
                    ) : item.type === 'page' ? (
                      <KanbanCard
                        feature={item}
                        index={index}
                        onUpdate={handlePageUpdate}
                        onDelete={onDeletePage}
                      />
                    ) : (
                      <KanbanCard
                        feature={item}
                        index={index}
                        onUpdate={handleFeatureUpdate}
                        onDelete={onDeleteFeature}
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