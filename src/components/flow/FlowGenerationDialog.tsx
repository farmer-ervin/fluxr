import React, { useState } from 'react';
import { Check, Loader2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface FlowPage {
  name: string;
  description: string;
  layout_description?: string;
  features?: string[];
}

interface FlowGenerationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pages: FlowPage[];
  onConfirm: (selectedPages: FlowPage[], additionalRequirements?: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function FlowGenerationDialog({
  isOpen,
  onClose,
  pages,
  onConfirm,
  isLoading = false,
  error = null,
}: FlowGenerationDialogProps) {
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [additionalRequirements, setAdditionalRequirements] = useState('');

  const handleTogglePage = (pageName: string) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageName)) {
      newSelected.delete(pageName);
    } else {
      newSelected.add(pageName);
    }
    setSelectedPages(newSelected);
  };

  const handleConfirm = () => {
    const selectedPageObjects = pages.filter(page => 
      selectedPages.has(page.name)
    );
    onConfirm(selectedPageObjects, additionalRequirements.trim() || undefined);
  };

  const handleSelectAll = () => {
    if (selectedPages.size === pages.length) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(pages.map(page => page.name)));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select Pages to Add</DialogTitle>
          <DialogDescription>
            Choose which pages you want to add to your user flow diagram.
            You can also provide additional requirements or modifications below.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500">
            {selectedPages.size} of {pages.length} pages selected
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSelectAll}
          >
            {selectedPages.size === pages.length ? 'Deselect All' : 'Select All'}
          </Button>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto py-4">
          {pages.map((page) => (
            <div
              key={page.name}
              className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                selectedPages.has(page.name)
                  ? 'border-brand-purple bg-brand-purple/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleTogglePage(page.name)}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 w-4 h-4 rounded border flex-shrink-0 ${
                  selectedPages.has(page.name)
                    ? 'bg-brand-purple border-brand-purple text-white'
                    : 'border-gray-300'
                }`}>
                  {selectedPages.has(page.name) && (
                    <Check className="w-3 h-3 mx-auto mt-0.5" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{page.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {page.description}
                  </p>
                  
                  {/* Show features if available */}
                  {page.features && page.features.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-xs font-medium text-gray-500">Features:</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {page.features.map((feature, idx) => (
                          <span 
                            key={idx} 
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Show layout description if available */}
                  {page.layout_description && (
                    <div className="mt-2">
                      <h4 className="text-xs font-medium text-gray-500">Layout:</h4>
                      <p className="text-xs text-gray-600 italic">
                        {page.layout_description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-700">Additional Requirements</h4>
          <Textarea
            value={additionalRequirements}
            onChange={(e) => setAdditionalRequirements(e.target.value)}
            placeholder="Add any additional requirements or modifications (e.g., 'Add a subscription management page' or 'Include a reports dashboard')"
            className="min-h-[80px]"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleConfirm}
            disabled={selectedPages.size === 0 || isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Layout...
              </span>
            ) : (
              'Add Selected Pages'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}