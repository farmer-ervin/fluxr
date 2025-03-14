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
import { uploadFile } from '@/lib/fileUpload';
import { ImageUpload } from '@/components/shared/ImageUpload';

interface Feature {
  name: string;
  description: string;
  priority: 'must-have' | 'nice-to-have' | 'not-prioritized';
  implementation_status: 'not_started' | 'in_progress' | 'completed';
  screenshot_url?: string;
  type: 'feature';
}

interface AddFeatureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (feature: Omit<Feature, 'id' | 'position'>) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function AddFeatureDialog({ isOpen, onClose, onAdd, isLoading, error }: AddFeatureDialogProps) {
  const [feature, setFeature] = useState<Omit<Feature, 'id' | 'position'>>({
    name: '',
    description: '',
    priority: 'not-prioritized',
    implementation_status: 'not_started',
    type: 'feature'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFeature(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageSelect = async (file: File) => {
    setSelectedFile(file);
    setUploadError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadProgress(true);
    setUploadError(null);
    let screenshotUrl = '';

    try {
      if (selectedFile) {
        const uploadedUrl = await uploadFile(selectedFile, 'feature-screenshots', 'features');
        if (uploadedUrl) {
          screenshotUrl = uploadedUrl;
        }
      }

      await onAdd({
        ...feature,
        screenshot_url: screenshotUrl || undefined
      });

      setFeature({
        name: '',
        description: '',
        priority: 'not-prioritized',
        implementation_status: 'not_started',
        type: 'feature'
      });
      setSelectedFile(null);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploadProgress(false);
    }
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

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Feature Name</Label>
              <Input
                id="name"
                name="name"
                value={feature.name}
                onChange={handleChange}
                placeholder="Enter feature name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={feature.description}
                onChange={handleChange}
                placeholder="Describe the feature and its benefits"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Screenshot</Label>
              <ImageUpload
                onImageSelect={handleImageSelect}
                onImageRemove={() => setSelectedFile(null)}
                isUploading={uploadProgress}
                error={uploadError}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                name="priority"
                value={feature.priority}
                onChange={handleChange}
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
                name="implementation_status"
                value={feature.implementation_status}
                onChange={handleChange}
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
            <Button variant="outline" onClick={onClose} type="button" disabled={isLoading || uploadProgress}>
              Cancel
            </Button>
            <Button 
              variant="secondary" 
              type="submit"
              disabled={isLoading || uploadProgress || !feature.name.trim() || !feature.description.trim()}
            >
              {(isLoading || uploadProgress) ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploadProgress ? 'Uploading...' : 'Adding...'}
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