import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Pencil, Loader2, AlertCircle, Trash2, ChevronDown, ChevronUp, List, Plus, X } from 'lucide-react';
import { useReactFlow } from 'reactflow';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface PageNodeData {
  name: string;
  description: string;
  layout_description?: string;
  features?: string[];
}

interface SaveStatus {
  saving: boolean;
  error: string | null;
}

export function PageNode({ data, isConnectable, id }: NodeProps<PageNodeData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [localData, setLocalData] = useState(data);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ saving: false, error: null });
  const { setNodes, setEdges } = useReactFlow();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);

      // Delete the page from the database
      const { error } = await supabase
        .from('flow_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update the UI immediately
      setNodes(nodes => nodes.filter(node => node.id !== id));
      setEdges(edges => edges.filter(edge => 
        edge.source !== id && edge.target !== id
      ));
      
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting page:', error);
      setIsDeleting(false);
      setShowDeleteDialog(false);
      
      setError('Failed to delete page. Please try again.');
      setShowDeleteDialog(false);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleSave = useCallback(async () => {
    // Validate input
    if (!localData.name.trim()) {
      setSaveStatus({ saving: false, error: 'Page name is required' });
      return;
    }

    setSaveStatus({ saving: true, error: null });

    // Save changes to the database
    try {
      const updateData = {
        name: localData.name.trim(),
        description: localData.description.trim(),
        layout_description: localData.layout_description?.trim() || null,
        features: localData.features || []
      };

      const { error } = await supabase
        .from('flow_pages')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Update local data
      data.name = localData.name.trim();
      data.description = localData.description.trim();
      data.layout_description = localData.layout_description?.trim() || null;
      data.features = localData.features || [];
      
      setIsEditing(false);
      setSaveStatus({ saving: false, error: null });
    } catch (error) {
      console.error('Error saving page:', error);
      setSaveStatus({ 
        saving: false, 
        error: 'Failed to save changes. Please try again.' 
      });
    }
  }, [data, localData, id]);

  if (!data) {
    return null;
  }

  const handleCancel = () => {
    setLocalData(data);
    setIsEditing(false);
    setSaveStatus({ saving: false, error: null });
  };

  const toggleExpand = () => {
    if (!isEditing) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-lg p-4 w-[250px] max-w-[300px] border border-gray-200 transition-all ${
        isExpanded ? 'min-h-[250px]' : ''
      } ${isEditing ? 'border-brand-purple' : 'hover:border-gray-300'}`}
      ref={contentRef}
    >
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-brand-purple !left-[-7px]"
      />
      
      <div className="flex justify-between items-start mb-2">
        {isEditing ? (
          <input
            type="text"
            value={localData.name}
            onChange={e => {
              setLocalData(prev => ({ 
                ...prev, 
                name: e.target.value 
              }));
              setError(null);
            }}
            className="text-lg font-semibold bg-gray-50 border border-gray-200 rounded px-2 py-1 w-full"
            autoFocus
            placeholder="Enter page name"
          />
        ) : (
          <h3 
            className="text-lg font-semibold text-gray-900 cursor-pointer"
            onClick={toggleExpand}
          >
            {data.name}
          </h3>
        )}
        
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={saveStatus.saving}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSave}
              disabled={saveStatus.saving}
            >
              {saveStatus.saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Save'
              )}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {isExpanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="ml-2 hover:bg-gray-100"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost" 
              size="sm"
              onClick={toggleExpand}
              className="hover:bg-gray-100"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Basic description shown in both compact and expanded view */}
      <div className="mb-3">
        {isEditing ? (
          <textarea
            value={localData.description}
            onChange={e => {
              setLocalData(prev => ({ 
                ...prev, 
                description: e.target.value 
              }));
              setSaveStatus({ saving: false, error: null });
            }}
            className="w-full min-h-[60px] max-h-[120px] text-sm bg-gray-50 border border-gray-200 rounded px-2 py-1 resize-y"
            placeholder="Describe the core functionality..."
          />
        ) : (
          <p 
            className="text-sm text-gray-600 whitespace-pre-wrap break-words cursor-pointer"
            onClick={toggleExpand}
          >
            {data.description}
          </p>
        )}
      </div>

      {/* Additional content shown only in expanded view */}
      {(isExpanded || isEditing) && (
        <div className="space-y-4 border-t pt-3 mt-2">
          {isEditing && (
            <div className="flex justify-end mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Page
              </Button>
            </div>
          )}

          {(error || saveStatus.error) && (
            <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {error || saveStatus.error}
            </div>
          )}

          {/* Layout Description */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Layout</h4>
            {isEditing ? (
              <textarea
                value={localData.layout_description || ''}
                onChange={e => {
                  setLocalData(prev => ({ 
                    ...prev, 
                    layout_description: e.target.value 
                  }));
                }}
                className="w-full min-h-[60px] text-sm bg-gray-50 border border-gray-200 rounded px-2 py-1 resize-y"
                placeholder="Describe the page layout..."
              />
            ) : (
              <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">
                {data.layout_description || 'No layout description available'}
              </p>
            )}
          </div>

          {/* Features */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
              <List className="w-4 h-4 mr-1" />
              Features
            </h4>
            {isEditing ? (
              <div className="space-y-2">
                {(localData.features || []).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={e => {
                        const newFeatures = [...(localData.features || [])];
                        newFeatures[index] = e.target.value;
                        setLocalData(prev => ({
                          ...prev,
                          features: newFeatures
                        }));
                      }}
                      className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded px-2 py-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newFeatures = [...(localData.features || [])];
                        newFeatures.splice(index, 1);
                        setLocalData(prev => ({
                          ...prev,
                          features: newFeatures
                        }));
                      }}
                      className="text-red-500 hover:text-red-700 p-1 h-auto"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLocalData(prev => ({
                      ...prev,
                      features: [...(prev.features || []), '']
                    }));
                  }}
                  className="text-sm"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Feature
                </Button>
              </div>
            ) : (
              <ul className="text-sm text-gray-600 list-disc list-inside">
                {(data.features && data.features.length > 0) ? (
                  data.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))
                ) : (
                  <li className="text-gray-400">No features listed</li>
                )}
              </ul>
            )}
          </div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-brand-purple !right-[-7px]"
      />
      
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Page</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this page? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </span>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}