import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RefinementResponse, FlowPage } from '@/lib/openai';
import { AlertCircle, ArrowLeftIcon } from 'lucide-react';

interface RefinementChangesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  refinementResult: RefinementResponse | null;
  onAccept: (pages: FlowPage[]) => void;
  onRevert: () => void;
  error?: string | null;
}

export function RefinementChangesDialog({
  isOpen,
  onClose,
  refinementResult,
  onAccept,
  onRevert,
  error
}: RefinementChangesDialogProps) {
  if (!refinementResult) return null;

  const hasChanges = 
    refinementResult.changes.added_pages.length > 0 || 
    refinementResult.changes.modified_pages.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Changes</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 mb-4 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {!hasChanges && (
            <p className="text-gray-600">
              No changes were necessary to meet the additional requirements.
              The original flow already satisfies all requirements.
            </p>
          )}

          {refinementResult.changes.added_pages.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Added Pages:</h3>
              <ul className="list-disc pl-5 space-y-1">
                {refinementResult.changes.added_pages.map((page, i) => (
                  <li key={i} className="text-gray-700">{page}</li>
                ))}
              </ul>
            </div>
          )}

          {refinementResult.changes.modified_pages.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Modified Pages:</h3>
              {refinementResult.changes.modified_pages.map((page, i) => (
                <div key={i} className="mb-4 bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">{page.page_name}</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {page.modifications.map((mod, j) => (
                      <li key={j} className="text-gray-700">{mod}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onRevert}
              className="flex items-center gap-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Revert to Original
            </Button>
            <Button onClick={() => onAccept(refinementResult.pages)}>
              Accept Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 