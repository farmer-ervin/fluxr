import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Plus, AlertCircle, Trash2, GripVertical } from 'lucide-react';
import { Button } from './ui/button';
import { AutoTextarea } from './ui/auto-textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Priority = 'must-have' | 'nice-to-have' | 'not-prioritized';
type ImplementationStatus = 'not_started' | 'in_progress' | 'completed';

interface Feature {
  id: string;
  name: string;
  description: string;
  priority: Priority;
  implementation_status: ImplementationStatus;
  position?: number;
}

interface FeatureBucket {
  id: string;
  title: string;
  features: Feature[];
}

interface FeatureBucketsProps {
  content: string;
  onChange: (content: string) => void;
}

interface FeatureCardProps {
  feature: Feature;
  bucketId: string;
  updateFeature: (bucketId: string, featureId: string, field: keyof Feature, value: string) => void;
  onDelete: (featureId: string) => void;
}

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: 'must-have', label: 'Must Have', color: 'text-red-600' },
  { value: 'nice-to-have', label: 'Nice to Have', color: 'text-yellow-600' },
  { value: 'not-prioritized', label: 'Not Prioritized', color: 'text-gray-600' }
];

const statusOptions = [
  { value: 'not_started', label: 'Not Started', color: 'text-gray-600' },
  { value: 'in_progress', label: 'In Progress', color: 'text-blue-600' },
  { value: 'completed', label: 'Completed', color: 'text-green-600' }
];

function SortableFeatureCard({ feature, bucketId, updateFeature, onDelete }: FeatureCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: feature.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  const [isEditing, setIsEditing] = useState(!feature.name);
  const [localFeature, setLocalFeature] = useState(feature);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleSave = () => {
    if (!localFeature.name.trim()) {
      setError('Feature name is required');
      setLocalFeature(prev => ({ ...prev, name: 'Untitled Feature' }));
      return;
    }
    
    updateFeature(bucketId, feature.id, 'name', localFeature.name);
    updateFeature(bucketId, feature.id, 'description', localFeature.description);
    setIsEditing(false);
    setError(null);
  };

  const handleInputChange = (field: keyof Feature, value: string) => {
    const updatedFeature = { ...localFeature, [field]: value };
    setLocalFeature(updatedFeature);
    
    if (field !== 'name' && field !== 'description') {
      updateFeature(bucketId, feature.id, field, value);
    }
  };

  const handleCancel = () => {
    setLocalFeature(feature);
    setIsEditing(false);
    setError(null);
  };

  const handleDelete = async () => {
    onDelete(feature.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`bg-white rounded-lg border ${isEditing ? 'border-brand-purple' : 'border-gray-200'} p-4 space-y-4 transition-colors`}
      >
        {!isEditing ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  {...attributes}
                  {...listeners}
                  className="cursor-grab hover:text-brand-purple"
                >
                  <GripVertical className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-medium text-gray-900">{feature.name || 'Untitled Feature'}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${
                  statusOptions.find(opt => opt.value === feature.implementation_status)?.color || 'text-gray-600'
                }`}>
                  {statusOptions.find(opt => opt.value === feature.implementation_status)?.label}
                </span>
                <span className={`text-sm font-medium ${
                  priorityOptions.find(opt => opt.value === feature.priority)?.color || 'text-gray-600'
                }`}>
                  {priorityOptions.find(opt => opt.value === feature.priority)?.label}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {feature.description && (
              <p className="text-gray-600">{feature.description}</p>
            )}
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feature Name
                </label>
                <input
                  type="text"
                  value={localFeature.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onBlur={() => {
                    if (localFeature.name.trim()) {
                      handleSave();
                    }
                    setError(null);
                  }}
                  placeholder="Enter feature name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                />
                {error && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <AutoTextarea
                  value={localFeature.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the feature and its benefits"
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={localFeature.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value as Priority)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                >
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Implementation Status
                </label>
                <select
                  value={localFeature.implementation_status}
                  onChange={(e) => handleInputChange('implementation_status', e.target.value as ImplementationStatus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSave}
              >
                Save Changes
              </Button>
            </div>
          </>
        )}
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Feature</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this feature? This action cannot be undone.
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
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function FeatureBuckets({ content, onChange }: FeatureBucketsProps) {
  const { productSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buckets, setBuckets] = useState<FeatureBucket[]>([
    { id: 'features', title: 'Features', features: [] }
  ]);

  // Move sensors to top level
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadFeatures();
  }, [productSlug]);

  async function loadFeatures() {
    if (!productSlug) return;

    try {
      setLoading(true);
      setError(null);

      // First get the product ID
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id')
        .eq('slug', productSlug)
        .single();

      if (productError) throw productError;
      if (!product) throw new Error('Product not found');

      // Then get all features for this product
      const { data: features, error: featuresError } = await supabase
        .from('features')
        .select('*')
        .eq('product_id', product.id)
        .order('position', { ascending: true });

      if (featuresError) throw featuresError;

      // Group features into buckets
      const allFeatures = features || [];
      setBuckets([
        {
          id: 'features',
          title: 'Features',
          features: allFeatures
        }
      ]);
    } catch (err) {
      console.error('Error loading features:', err);
      setError('Failed to load features');
    } finally {
      setLoading(false);
    }
  }

  const addFeature = async (bucketId: string) => {
    if (!productSlug) return;

    try {
      // Get the product ID
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id')
        .eq('slug', productSlug)
        .single();

      if (productError) throw productError;
      if (!product) throw new Error('Product not found');

      // Create a new feature
      const { data: newFeature, error: insertError } = await supabase
        .from('features')
        .insert({
          product_id: product.id,
          name: 'New Feature',
          description: '',
          priority: 'not-prioritized',
          implementation_status: 'not_started',
          position: buckets[0].features.length
        })
        .select()
        .single();

      if (insertError) throw insertError;
      if (!newFeature) throw new Error('Failed to create feature');

      // Update local state
      setBuckets(prev => prev.map(bucket => {
        if (bucket.id === bucketId) {
          return {
            ...bucket,
            features: [...bucket.features, newFeature]
          };
        }
        return bucket;
      }));
    } catch (err) {
      console.error('Error adding feature:', err);
      setError('Failed to add feature');
    }
  };

  const updateFeature = async (bucketId: string, featureId: string, field: keyof Feature, value: string) => {
    try {
      const { error } = await supabase
        .from('features')
        .update({ [field]: value })
        .eq('id', featureId);

      if (error) throw error;

      // Update local state
      setBuckets(prev => prev.map(bucket => {
        if (bucket.id === bucketId) {
          return {
            ...bucket,
            features: bucket.features.map(feature =>
              feature.id === featureId
                ? { ...feature, [field]: value }
                : feature
            )
          };
        }
        return bucket;
      }));
    } catch (err) {
      console.error('Error updating feature:', err);
      setError('Failed to update feature');
    }
  };

  const deleteFeature = async (featureId: string) => {
    try {
      const { error } = await supabase
        .from('features')
        .delete()
        .eq('id', featureId);

      if (error) throw error;

      // Update local state
      setBuckets(prev => prev.map(bucket => ({
        ...bucket,
        features: bucket.features.filter(feature => feature.id !== featureId)
      })));
    } catch (err) {
      console.error('Error deleting feature:', err);
      setError('Failed to delete feature');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = buckets[0].features.findIndex(f => f.id === active.id);
    const newIndex = buckets[0].features.findIndex(f => f.id === over.id);

    // Update positions in the database
    const updatedFeatures = arrayMove(buckets[0].features, oldIndex, newIndex).map((feature, index) => ({
      ...feature,
      position: index
    }));

    try {
      // Update all feature positions in a single transaction
      const { error } = await supabase
        .from('features')
        .upsert(updatedFeatures.map(f => ({ id: f.id, position: f.position })));

      if (error) throw error;

      // Update local state
      setBuckets(prev => prev.map(bucket => {
        if (bucket.id === 'features') {
          return {
            ...bucket,
            features: updatedFeatures
          };
        }
        return bucket;
      }));
    } catch (err) {
      console.error('Error updating feature positions:', err);
      setError('Failed to update feature order');
    }
  };

  if (loading) return <div>Loading...</div>;

  const bucket = buckets[0];

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      <div className="space-y-4 min-h-[100px] rounded-lg p-4 bg-gray-50">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={bucket.features.map(f => f.id)}
            strategy={verticalListSortingStrategy}
          >
            {bucket.features.map((feature) => (
              <SortableFeatureCard
                key={feature.id}
                feature={feature}
                bucketId={bucket.id}
                updateFeature={updateFeature}
                onDelete={deleteFeature}
              />
            ))}
          </SortableContext>
        </DndContext>
        <button
          onClick={() => addFeature(bucket.id)}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Feature</span>
        </button>
      </div>
    </div>
  );
}