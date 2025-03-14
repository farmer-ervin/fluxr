import React, { useState } from 'react';
import { Bug } from '@/types/bug';
import { Button } from '@/components/ui/button';
import { Trash2, ExternalLink, Image, Pencil, Tag } from 'lucide-react';
import { EditBugDialog } from './EditBugDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BugCardProps {
  bug: Bug;
  index: number;
  onStatusChange?: (bugId: string, newStatus: string) => void;
  onDelete?: (bugId: string) => void;
  onEdit?: (bug: Bug) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function BugCard({ bug, index, onStatusChange, onDelete, onEdit, isLoading, error }: BugCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);

  const priorityColors = {
    'must-have': 'bg-red-100 text-red-800',
    'nice-to-have': 'bg-yellow-100 text-yellow-800',
    'not-prioritized': 'bg-gray-100 text-gray-800'
  };

  const handleEdit = async (bugData: Partial<Bug>) => {
    if (onEdit) {
      await onEdit(bugData as Bug);
      setIsEditing(false);
    }
  };

  return (
    <>
      <div 
        className="bg-white rounded-lg shadow p-4 space-y-2 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setIsViewing(true)}
      >
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-gray-900">{bug.name}</h4>
          <div className="flex space-x-1">
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
            {bug.bug_url && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(bug.bug_url, '_blank');
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(bug.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2">{bug.description}</p>

        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[bug.priority]}`}>
            {bug.priority.replace(/-/g, ' ')}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <Tag className="w-3 h-3 mr-1" />
            Bug
          </span>
          {bug.screenshot_url && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                window.open(bug.screenshot_url, '_blank');
              }}
            >
              <Image className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <EditBugDialog
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSave={handleEdit}
        isLoading={isLoading}
        error={error}
        bug={bug}
      />

      <Dialog open={isViewing} onOpenChange={setIsViewing}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{bug.name}</DialogTitle>
            <DialogDescription>
              Bug Details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{bug.description}</p>
            </div>

            {bug.bug_url && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Bug URL</h3>
                <a 
                  href={bug.bug_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-purple hover:underline"
                >
                  {bug.bug_url}
                </a>
              </div>
            )}

            {bug.screenshot_url && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Screenshot</h3>
                <img 
                  src={bug.screenshot_url} 
                  alt="Bug screenshot" 
                  className="max-h-96 rounded-lg border border-gray-200"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[bug.priority]}`}>
                {bug.priority.replace(/-/g, ' ')}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <Tag className="w-3 h-3 mr-1" />
                Bug
              </span>
              <span className="text-sm text-gray-600">
                Created: {new Date(bug.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 