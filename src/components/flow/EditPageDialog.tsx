import React, { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
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

interface EditPageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pageData: PageData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  initialData: PageData;
}

export interface PageData {
  name: string;
  description: string;
  layout_description: string;
  features: string[];
}

export function EditPageDialog({
  isOpen,
  onClose,
  onSave,
  isLoading,
  error,
  initialData
}: EditPageDialogProps) {
  const [page, setPage] = useState<PageData>(initialData);
  const [featuresInput, setFeaturesInput] = useState(initialData.features.join(', '));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPage(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFeaturesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFeaturesInput(e.target.value);
  };

  const handleSave = async () => {
    // Parse features from comma-separated string
    const features = featuresInput.split(',')
      .map(feature => feature.trim())
      .filter(feature => feature !== '');

    await onSave({
      ...page,
      features
    });
  };

  const resetForm = () => {
    setPage(initialData);
    setFeaturesInput(initialData.features.join(', '));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
      }
      onClose();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Page</DialogTitle>
          <DialogDescription>
            Update the page details below.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Page Name</Label>
            <Input
              id="name"
              name="name"
              value={page.name}
              onChange={handleChange}
              placeholder="e.g., Login Page"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={page.description}
              onChange={handleChange}
              placeholder="Describe the purpose and functionality of this page..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="layout_description">Layout Description</Label>
            <Textarea
              id="layout_description"
              name="layout_description"
              value={page.layout_description}
              onChange={handleChange}
              placeholder="Describe the layout structure using design terminology..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="features">Features (comma-separated)</Label>
            <Textarea
              id="features"
              value={featuresInput}
              onChange={handleFeaturesChange}
              placeholder="Login Form, Remember Me, Forgot Password..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="secondary" 
            onClick={handleSave} 
            disabled={isLoading || !page.name.trim()}
          >
            {isLoading ? (
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
  );
} 