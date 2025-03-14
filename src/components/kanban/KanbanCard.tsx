import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Pencil, Loader2, AlertCircle, Tag } from 'lucide-react';
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

interface Feature {
  id: string;
  name: string;
  description: string;
  priority: 'must-have' | 'nice-to-have' | 'not-prioritized';
  implementation_status: 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'deferred';
  position: number;
  type?: 'feature' | 'page' | 'task' | 'bug';
}

interface KanbanCardProps {
  feature: Feature;
  index: number;
  onUpdate: () => void;
}

const priorityColors = {
  'must-have': 'text-red-600',
  'nice-to-have': 'text-yellow-600',
  'not-prioritized': 'text-gray-600'
};

const typeColors = {
  'feature': 'bg-blue-100 text-blue-800',
  'page': 'bg-purple-100 text-purple-800',
  'task': 'bg-green-100 text-green-800',
  'bug': 'bg-red-100 text-red-800'
};

export function KanbanCard({ feature, index, onUpdate }: KanbanCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localData, setLocalData] = useState(feature || {});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default to 'feature' type if not set
  const displayType = feature?.type || 'feature';
  const isPage = displayType === 'page';

  const handleSave = async () => {
    if (!localData.name.trim()) {
      setError('Name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isPage) {
        const { error } = await supabase
          .from('flow_pages')
          .update({
            name: localData.name.trim(),
            description: localData.description.trim(),
            layout_description: (localData as any).layout_description?.trim() || '',
          })
          .eq('id', feature.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('features')
          .update({
            name: localData.name.trim(),
            description: localData.description.trim(),
            priority: localData.priority,
            type: localData.type || 'feature'
          })
          .eq('id', feature.id);

        if (error) throw error;
      }

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating item:', error);
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePageSave = async (pageData: any) => {
    setIsSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('flow_pages')
        .update({
          name: pageData.name.trim(),
          description: pageData.description.trim(),
          layout_description: pageData.layout_description?.trim() || '',
        })
        .eq('id', feature.id);

      if (error) throw error;

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating page:', error);
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const cardContent = (
    <>
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900 line-clamp-2">{feature.name}</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="hover:bg-gray-100 ml-2 flex-shrink-0"
        >
          <Pencil className="w-4 h-4" />
        </Button>
      </div>

      {feature.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-3 min-h-[3em]">{feature.description}</p>
      )}

      <div className="flex items-center gap-2 text-sm flex-wrap mt-2">
        {!isPage && (
          <span className={`${priorityColors[feature.priority]} px-2 py-0.5 rounded-full text-xs font-medium bg-opacity-10`}>
            {feature.priority.replace(/-/g, ' ')}
          </span>
        )}
        
        {displayType && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[displayType] || 'bg-gray-100 text-gray-800'}`}>
            <Tag className="w-3 h-3 mr-1" />
            {displayType.charAt(0).toUpperCase() + displayType.slice(1)}
          </span>
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
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Feature</DialogTitle>
              <DialogDescription>
                Update the feature details below.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={localData.name}
                  onChange={(e) => setLocalData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={localData.description}
                  onChange={(e) => setLocalData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={localData.priority}
                  onChange={(e) => setLocalData(prev => ({ 
                    ...prev, 
                    priority: e.target.value as Feature['priority']
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                >
                  <option value="must-have">Must Have</option>
                  <option value="nice-to-have">Nice to Have</option>
                  <option value="not-prioritized">Not Prioritized</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditing(false)} type="button">
                Cancel
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleSave}
                disabled={isSaving || !localData.name.trim()}
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
      {cardContent}
    </div>
  );
}