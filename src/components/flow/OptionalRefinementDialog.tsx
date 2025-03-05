import React, { useState } from 'react';
import { Sparkles, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FlowPage } from '@/lib/openai';

interface OptionalRefinementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPages: FlowPage[];
  onRefinementComplete: (refinedPages: FlowPage[]) => void;
  isRefining: boolean;
  refinementError: string | null;
  refinedPages: FlowPage[] | null;
  error: string | null;
  onStartRefinement: () => void;
}

export function OptionalRefinementDialog({
  isOpen,
  onClose,
  selectedPages,
  onRefinementComplete,
  isRefining,
  refinementError,
  refinedPages,
  error,
  onStartRefinement
}: OptionalRefinementDialogProps) {
  const [skipRefinement, setSkipRefinement] = useState(false);

  const handleSkip = () => {
    onRefinementComplete(selectedPages);
    onClose();
  };

  const handleAcceptRefinement = () => {
    if (refinedPages) {
      onRefinementComplete(refinedPages);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Optional Flow Refinement</DialogTitle>
          <DialogDescription>
            Would you like to further refine your selected pages? Our AI can optimize feature distribution and page organization.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 my-4">
            <AlertTriangle className="w-4 h-4" />
            <p>{error}</p>
          </div>
        )}

        {isRefining ? (
          <div className="py-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-purple mx-auto mb-4" />
            <p className="text-gray-600">Refining your flow...</p>
          </div>
        ) : refinedPages ? (
          <div className="space-y-4 my-4">
            <div className="bg-green-50 border border-green-100 rounded-lg p-4">
              <h4 className="font-medium text-green-700 mb-1 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Refinement Complete
              </h4>
              <p className="text-green-600 text-sm">
                Your flow has been refined with optimized feature distribution and improved page organization.
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Refinement Summary</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Optimized feature distribution across pages</li>
                <li>• Improved page organization and flow</li>
                <li>• Enhanced page descriptions for clarity</li>
                <li>• Ensured consistent terminology</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="bg-brand-purple/10 p-4 rounded-lg">
              <h3 className="font-medium text-brand-purple mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Refinement Benefits
              </h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Optimize feature distribution across pages</li>
                <li>• Ensure logical user flow progression</li>
                <li>• Improve page descriptions and terminology</li>
                <li>• Balance feature complexity across pages</li>
              </ul>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="skip-refinement"
                checked={skipRefinement}
                onChange={() => setSkipRefinement(!skipRefinement)}
                className="rounded border-gray-300 text-brand-purple focus:ring-brand-purple"
              />
              <label htmlFor="skip-refinement" className="text-sm text-gray-600">
                Skip refinement and proceed directly to layout generation
              </label>
            </div>
          </div>
        )}

        <DialogFooter>
          {refinedPages ? (
            <>
              <Button variant="outline" onClick={handleSkip}>
                Use Original
              </Button>
              <Button variant="secondary" onClick={handleAcceptRefinement}>
                Accept Refinement
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleSkip} disabled={isRefining}>
                {skipRefinement ? 'Continue Without Refinement' : 'Skip'}
              </Button>
              <Button 
                variant="secondary" 
                onClick={onStartRefinement}
                disabled={isRefining || skipRefinement}
              >
                {isRefining ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Refining...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Refine Flow
                  </span>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}