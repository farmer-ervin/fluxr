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
import { Feature } from '@/types/feature';

interface EditFeatureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (featureData: Partial<Feature>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  feature: Feature;
}

export function EditFeatureDialog({
  isOpen,
  onClose,
  onSave,
  isLoading,
  error,
  feature
}: EditFeatureDialogProps) {
  const [editedFeature, setEditedFeature] = useState<Partial<Feature>>(feature);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedFeature(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageSelect = async (file: File) => {
    setSelectedFile(file);
    setUploadError(null);
  };

  const handleSubmit = async () => {
    setUploadProgress(true);
    setUploadError(null);
    let screenshotUrl = editedFeature.screenshot_url;

    try {
      if (selectedFile) {
        const uploadedUrl = await uploadFile(selectedFile, 'feature-screenshots', 'features');
        if (uploadedUrl) {
          screenshotUrl = uploadedUrl;
        }
      }

      await onSave({
        ...editedFeature,
        screenshot_url: screenshotUrl
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Feature</DialogTitle>
          <DialogDescription>
            Update the feature details below.
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
            <Label htmlFor="name">Feature Name</Label>
            <Input
              id="name"
              name="name"
              value={editedFeature.name}
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
              value={editedFeature.description}
              onChange={handleChange}
              placeholder="Describe the feature and its benefits"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Screenshot</Label>
            <ImageUpload
              onImageSelect={handleImageSelect}
              currentImageUrl={editedFeature.screenshot_url}
              onImageRemove={() => {
                setSelectedFile(null);
                setEditedFeature(prev => ({ ...prev, screenshot_url: undefined }));
              }}
              isUploading={uploadProgress}
              error={uploadError}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              name="priority"
              value={editedFeature.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
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
              value={editedFeature.implementation_status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading || uploadProgress}>
            Cancel
          </Button>
          <Button 
            variant="secondary" 
            onClick={handleSubmit} 
            disabled={isLoading || uploadProgress || !editedFeature.name?.trim()}
          >
            {(isLoading || uploadProgress) ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {uploadProgress ? 'Uploading...' : 'Saving...'}
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