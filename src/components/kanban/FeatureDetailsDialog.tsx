import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pencil, Tag, Image } from 'lucide-react';
import { Feature } from '@/types/feature';

interface FeatureDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  feature: Feature;
  onEdit: () => void;
}

export function FeatureDetailsDialog({
  isOpen,
  onClose,
  feature,
  onEdit,
}: FeatureDetailsDialogProps) {
  const priorityColors = {
    'must-have': 'bg-red-100 text-red-800',
    'nice-to-have': 'bg-yellow-100 text-yellow-800',
    'not-prioritized': 'bg-gray-100 text-gray-800'
  };

  const statusColors = {
    'not_started': 'bg-gray-100 text-gray-800',
    'in_progress': 'bg-blue-100 text-blue-800',
    'completed': 'bg-green-100 text-green-800'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{feature.name}</DialogTitle>
          <DialogDescription>
            Feature Details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{feature.description}</p>
          </div>

          {feature.screenshot_url && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Screenshot</h3>
              <img 
                src={feature.screenshot_url} 
                alt="Feature screenshot" 
                className="max-h-96 rounded-lg border border-gray-200"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {feature.priority && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[feature.priority] || 'bg-gray-100 text-gray-800'}`}>
                {feature.priority.replace(/-/g, ' ')}
              </span>
            )}
            {feature.implementation_status && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[feature.implementation_status] || 'bg-gray-100 text-gray-800'}`}>
                {feature.implementation_status.replace(/_/g, ' ')}
              </span>
            )}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Tag className="w-3 h-3 mr-1" />
              Feature
            </span>
            {feature.created_at && (
              <span className="text-sm text-gray-600">
                Created: {new Date(feature.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            onClick={onEdit}
            className="flex items-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            Edit Feature
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 