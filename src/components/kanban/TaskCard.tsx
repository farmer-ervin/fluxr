import React, { useState } from 'react';
import { Task } from '@/types/task';
import { Pencil, Tag, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EditTaskDialog } from './EditTaskDialog';

interface TaskCardProps {
  task: Task;
  index: number;
  onStatusChange?: (taskId: string, newStatus: string) => void;
  onDelete?: (taskId: string) => void;
  onEdit?: (taskId: string, taskData: Partial<Task>) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

const priorityColors = {
  'must-have': 'bg-red-100 text-red-800',
  'nice-to-have': 'bg-yellow-100 text-yellow-800',
  'not-prioritized': 'bg-gray-100 text-gray-800',
};

export function TaskCard({
  task,
  index,
  onStatusChange,
  onDelete,
  onEdit,
  isLoading,
  error
}: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);

  const handleEdit = async (taskData: Partial<Task>) => {
    if (onEdit) {
      try {
        await onEdit(task.id, taskData);
        setIsEditing(false);
      } catch (error) {
        console.error('Error updating task:', error);
      }
    }
  };

  const priorityText = task.priority.replace(/-/g, ' ');
  const priorityClass = priorityColors[task.priority as keyof typeof priorityColors];

  return (
    <>
      <div
        className="bg-white rounded-lg shadow-sm p-4 mb-2 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setIsViewing(true)}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-gray-900 flex-grow">{task.name}</h3>
          <div className="flex items-center gap-2 ml-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="text-sm text-gray-500 mb-3 line-clamp-2">
          {task.description}
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${priorityClass}`}>
            {priorityText}
          </span>
        </div>
      </div>

      <Dialog open={isViewing} onOpenChange={setIsViewing}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {task.name}
            </DialogTitle>
            <DialogDescription>
              Created on {new Date(task.created_at).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-gray-600 whitespace-pre-wrap">{task.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityClass}`}>
                {priorityText}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <Tag className="w-3 h-3 mr-1" />
                Task
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isEditing && (
        <EditTaskDialog
          task={task}
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          onSubmit={handleEdit}
          isLoading={isLoading}
          error={error}
        />
      )}
    </>
  );
} 