import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2, Upload, X } from 'lucide-react';
import { uploadFile } from '@/lib/fileUpload';

// Define separate schemas for different item types
const baseSchema = {
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['must-have', 'nice-to-have', 'not-prioritized']),
};

const featureSchema = z.object(baseSchema);
const bugSchema = z.object({
  ...baseSchema,
  bug_url: z.string().optional(),
});
const taskSchema = z.object(baseSchema);

const pageSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['must-have', 'nice-to-have', 'not-prioritized']).optional(),
  layout_description: z.string().optional(),
  features: z.string().optional(),
});

type FormValues = z.infer<typeof pageSchema>;

interface KanbanDialogProps {
  type: 'feature' | 'page' | 'bug' | 'task';
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function KanbanDialog({ 
  type, 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading = false,
  error = null
}: KanbanDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<boolean>(false);

  // For simple types, use react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(
      type === 'page' ? pageSchema : 
      type === 'bug' ? bugSchema : 
      featureSchema
    ),
    defaultValues: {
      name: '',
      description: '',
      priority: 'not-prioritized',
      layout_description: '',
      features: '',
    },
  });

  const handleSubmit = async (data: FormValues) => {
    let processedData = { ...data };
    
    // Process features for page type
    if (type === 'page' && data.features) {
      processedData.features = data.features
        .split(',')
        .map(item => item.trim())
        .filter(item => item !== '');
    }
    
    // Handle file upload for bug type
    if (type === 'bug' && selectedFile) {
      setUploadProgress(true);
      try {
        const uploadedUrl = await uploadFile(selectedFile, 'bug-screenshots', 'bugs');
        if (uploadedUrl) {
          processedData.screenshot_url = uploadedUrl;
        }
      } catch (error) {
        console.error('File upload error:', error);
      } finally {
        setUploadProgress(false);
      }
    }
    
    onSubmit(processedData);
    form.reset();
    setSelectedFile(null);
  };

  // Render specialized dialog for Pages
  if (type === 'page') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Page</DialogTitle>
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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Page Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Login Page" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the purpose and functionality of this page..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="layout_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Layout Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the layout structure using design terminology..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="features"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Features (Optional, comma-separated)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Login Form, Remember Me, Forgot Password..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="must-have">Must Have</SelectItem>
                        <SelectItem value="nice-to-have">Nice to Have</SelectItem>
                        <SelectItem value="not-prioritized">Not Prioritized</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </span>
                  ) : (
                    'Add Page'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }

  // Render specialized dialog for Bugs
  if (type === 'bug') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Bug</DialogTitle>
            <DialogDescription>
              Report a new bug by filling out the details below.
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
                {...form.register('name')}
                placeholder="e.g., Login Form Validation Error"
                required
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Describe the bug in detail..."
                rows={3}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bug_url">Bug URL</Label>
              <Input
                id="bug_url"
                {...form.register('bug_url')}
                placeholder="URL where the bug can be reproduced"
              />
            </div>

            <div className="space-y-2">
              <Label>Screenshot</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('bug_screenshot')?.click()}
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
                id="bug_screenshot"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              {selectedFile && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{selectedFile.name}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select 
                onValueChange={value => form.setValue('priority', value as 'must-have' | 'nice-to-have' | 'not-prioritized')} 
                defaultValue={form.getValues('priority')}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="must-have">Must Have</SelectItem>
                  <SelectItem value="nice-to-have">Nice to Have</SelectItem>
                  <SelectItem value="not-prioritized">Not Prioritized</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.priority && (
                <p className="text-sm text-red-500">{form.formState.errors.priority.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isLoading || uploadProgress}>
              Cancel
            </Button>
            <Button 
              onClick={form.handleSubmit(handleSubmit)} 
              disabled={isLoading || uploadProgress || !form.getValues('name')}
            >
              {isLoading || uploadProgress ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploadProgress ? 'Uploading...' : 'Adding...'}
                </span>
              ) : (
                'Add Bug'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Default dialog for feature, task
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add {type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle>
          <DialogDescription>
            Fill in the details for the new {type}.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <p>{error}</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder={`Enter ${type} name`} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={`Enter ${type} description`}
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="must-have">Must Have</SelectItem>
                      <SelectItem value="nice-to-have">Nice to Have</SelectItem>
                      <SelectItem value="not-prioritized">Not Prioritized</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </span>
                ) : (
                  `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 