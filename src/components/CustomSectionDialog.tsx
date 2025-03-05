import React, { useState, useEffect } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CustomSectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSection: (sectionName: string) => void;
  onRenameSection?: (sectionId: string, newName: string) => void;
  onDeleteSection?: (sectionId: string) => void;
  editingSection?: {
    id: string;
    title: string;
  };
}

export function CustomSectionDialog({ 
  isOpen, 
  onClose, 
  onAddSection, 
  onRenameSection,
  onDeleteSection,
  editingSection 
}: CustomSectionDialogProps) {
  const [sectionName, setSectionName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isEditMode = !!editingSection;

  // Set section name when editing an existing section
  useEffect(() => {
    if (isEditMode && editingSection) {
      setSectionName(editingSection.title);
    } else {
      setSectionName('');
    }
  }, [isEditMode, editingSection, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sectionName.trim()) {
      setError('Section name is required');
      return;
    }
    
    if (isEditMode && onRenameSection && editingSection) {
      onRenameSection(editingSection.id, sectionName.trim());
    } else {
      onAddSection(sectionName.trim());
    }
    
    setError(null);
    onClose();
  };

  const handleDelete = () => {
    if (isEditMode && onDeleteSection && editingSection) {
      onDeleteSection(editingSection.id);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Section' : 'Add New Section'}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Update the name of this custom section.'
                : 'Create a new custom section for your PRD document.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label htmlFor="section-name" className="text-sm font-medium text-gray-700">
                Section Name
              </label>
              <Input
                id="section-name"
                value={sectionName}
                onChange={(e) => {
                  setSectionName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g., Competitive Analysis"
                autoFocus
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
            
            <DialogFooter className="pt-2 flex-col sm:flex-row gap-2">
              {isEditMode && onDeleteSection && (
                <Button 
                  type="button"
                  variant="destructive" 
                  className="sm:mr-auto"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Section
                </Button>
              )}
               <div className="flex gap-2 sm:ml-auto">
                <Button variant="outline" type="button" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="secondary">
                  {isEditMode ? 'Update Section' : 'Add Section'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "{editingSection?.title}" section? 
              This action cannot be undone and all content in this section will be permanently lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}