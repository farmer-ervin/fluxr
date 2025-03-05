import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Feature {
  name: string;
  description: string;
  priority: 'must-have' | 'nice-to-have' | 'not-prioritized';
  implementation_status: 'not_started' | 'in_progress' | 'completed';
  type: 'feature';
}

interface AddFeatureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (feature: Omit<Feature, 'id' | 'position'>) => Promise<void>;
  isLoading?: boolean;
}

export function AddFeatureDialog({ isOpen, onClose, onAdd, isLoading }: AddFeatureDialogProps) {
  const [feature, setFeature] = useState<Omit<Feature, 'id' | 'position'>>({
    name: '',
    description: '',
    priority: 'not-prioritized',
    implementation_status: 'not_started',
    type: 'feature'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAdd(feature);
    setFeature({
      name: '',
      description: '',
      priority: 'not-prioritized',
      implementation_status: 'not_started',
      type: 'feature'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Feature</DialogTitle>
          <DialogDescription>
            Add a new feature to your development board and PRD. This feature will be available in both places for tracking and documentation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Feature Name</Label>
              <Input
                id="name"
                value={feature.name}
                onChange={(e) => setFeature(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter feature name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={feature.description}
                onChange={(e) => setFeature(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the feature and its benefits"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={feature.priority}
                onChange={(e) => setFeature(prev => ({ ...prev, priority: e.target.value as Feature['priority'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                required
              >
                <option value="must-have">Must Have</option>
                <option value="nice-to-have">Nice to Have</option>
                <option value="not-prioritized">Not Prioritized</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="implementation_status">Implementation Status</Label>
              <select
                id="implementation_status"
                value={feature.implementation_status}
                onChange={(e) => setFeature(prev => ({ ...prev, implementation_status: e.target.value as Feature['implementation_status'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                required
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button 
              variant="secondary" 
              type="submit"
              disabled={isLoading || !feature.name.trim() || !feature.description.trim()}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </span>
              ) : (
                'Add Feature'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}