import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Pencil, Loader2, AlertCircle, Tag, Image } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EditPageDialog } from '@/components/flow/EditPageDialog';
import { FeatureDetailsDialog } from './FeatureDetailsDialog';
import { EditFeatureDialog } from './EditFeatureDialog';

interface Feature {
  id: string;
  name: string;
  description: string;
  priority: 'must-have' | 'nice-to-have' | 'not-prioritized';
  implementation_status: 'not_started' | 'in_progress' | 'completed';
  screenshot_url?: string;
  position: number;
  created_at: string;
  updated_at: string;
  type?: 'feature' | 'page' | 'task' | 'bug';
}

interface KanbanCardProps {
  feature: Feature;
  index: number;
  onUpdate: (featureId: string, updates: Partial<Feature>) => Promise<void>;
}

export function KanbanCard({ feature, index, onUpdate }: KanbanCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPage = feature.type === 'page';

  const handleSave = async (updates: Partial<Feature>) => {
    try {
      setIsSaving(true);
      setError(null);
      await onUpdate(feature.id, updates);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating feature:', error);
      setError('Failed to update feature');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePageSave = async (pageData: any) => {
    try {
      setIsSaving(true);
      setError(null);
      const { error } = await supabase
        .from('flow_pages')
        .update({
          name: pageData.name,
          description: pageData.description,
          layout_description: pageData.layout_description,
          features: pageData.features
        })
        .eq('id', feature.id);

      if (error) throw error;
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating page:', error);
      setError('Failed to update page');
    } finally {
      setIsSaving(false);
    }
  };

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

  const cardContent = (
    <>
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-gray-900">{feature.name}</h4>
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
      </div>

      <p className="text-sm text-gray-600 line-clamp-2">{feature.description}</p>

      <div className="flex items-center space-x-2">
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
        {feature.screenshot_url && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              window.open(feature.screenshot_url, '_blank');
            }}
          >
            <Image className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isPage ? (
        <EditPageDialog
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          onSave={handlePageSave}
          isLoading={isSaving}
          error={error}
          initialData={{
            name: feature.name,
            description: feature.description,
            layout_description: (feature as any).layout_description || '',
            features: []
          }}
        />
      ) : (
        <>
          <FeatureDetailsDialog
            isOpen={isViewing}
            onClose={() => setIsViewing(false)}
            feature={feature}
            onEdit={() => {
              setIsViewing(false);
              setIsEditing(true);
            }}
          />

          <EditFeatureDialog
            isOpen={isEditing}
            onClose={() => setIsEditing(false)}
            onSave={handleSave}
            isLoading={isSaving}
            error={error}
            feature={feature}
          />
        </>
      )}
    </>
  );

  return (
    <div 
      className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={(e) => {
        if (!isPage && !isEditing) {
          setIsViewing(true);
        }
      }}
    >
      {cardContent}
    </div>
  );
}