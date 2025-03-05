import React, { useState } from 'react';
import { Loader2, AlertTriangle, Upload, X } from 'lucide-react';
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
import { Bug, BugPriority } from '@/types/bug';

interface AddBugDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bugData: Partial<Bug>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  productId: string;
}

export function AddBugDialog({
  isOpen,
  onClose,
  onSave,
  isLoading,
  error,
  productId
}: AddBugDialogProps) {
  const [bug, setBug] = useState<Partial<Bug>>({
    name: '',
    description: '',
    bug_url: '',
    priority: 'not-prioritized',
    status: 'not_started',
    product_id: productId
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBug(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    setUploadProgress(true);
    let screenshotUrl = '';

    if (selectedFile) {
      const uploadedUrl = await uploadFile(selectedFile, 'bug-screenshots', 'bugs');
      if (uploadedUrl) {
        screenshotUrl = uploadedUrl;
      }
    }

    await onSave({
      ...bug,
      screenshot_url: screenshotUrl || undefined
    });

    setBug({
      name: '',
      description: '',
      bug_url: '',
      priority: 'not-prioritized',
      status: 'not_started',
      product_id: productId
    });
    setSelectedFile(null);
    setUploadProgress(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setBug({
          name: '',
          description: '',
          bug_url: '',
          priority: 'not-prioritized',
          status: 'not_started',
          product_id: productId
        });
        setSelectedFile(null);
      }
      onClose();
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Report Bug</DialogTitle>
          <DialogDescription>
            Create a new bug report by filling out the details below.
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
            <Label htmlFor="name">Bug Name</Label>
            <Input
              id="name"
              name="name"
              value={bug.name}
              onChange={handleChange}
              placeholder="e.g., Login Form Validation Error"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={bug.description}
              onChange={handleChange}
              placeholder="Describe the bug in detail..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bug_url">Bug URL</Label>
            <Input
              id="bug_url"
              name="bug_url"
              value={bug.bug_url}
              onChange={handleChange}
              placeholder="URL where the bug can be reproduced"
            />
          </div>

          <div className="space-y-2">
            <Label>Screenshot</Label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('screenshot')?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {selectedFile ? selectedFile.name : 'Upload Screenshot'}
              </Button>
              {selectedFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <input
              type="file"
              id="screenshot"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              name="priority"
              value={bug.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent"
            >
              <option value="must-have">Must Have</option>
              <option value="nice-to-have">Nice to Have</option>
              <option value="not-prioritized">Not Prioritized</option>
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
            disabled={isLoading || uploadProgress || !bug.name.trim()}
          >
            {(isLoading || uploadProgress) ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {uploadProgress ? 'Uploading...' : 'Creating...'}
              </span>
            ) : (
              'Create Bug'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 