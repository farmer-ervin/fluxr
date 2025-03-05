import React from 'react';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
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

interface ProblemItem {
  title: string;
  description: string;
}

interface ImprovementItem {
  title: string;
  description: string;
}

interface ReviewResult {
  analysis: {
    problems: ProblemItem[];
    improvements: ImprovementItem[];
  };
  pages: FlowPage[];
}

interface FlowReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reviewResult: ReviewResult | null;
  isLoading: boolean;
  error: string | null;
  onAcceptReview: (pages: FlowPage[]) => void;
}

export function FlowReviewDialog({
  isOpen,
  onClose,
  reviewResult,
  isLoading,
  error,
  onAcceptReview,
}: FlowReviewDialogProps) {
  const handleAccept = () => {
    if (reviewResult) {
      onAcceptReview(reviewResult.pages);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Review of User Flow</DialogTitle>
          <DialogDescription>
            Our AI has analyzed the initial user flow and suggested improvements.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-purple mx-auto mb-4" />
            <p className="text-gray-600">Analyzing user flow...</p>
          </div>
        ) : reviewResult ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Problems Identified
              </h3>
              <div className="space-y-3">
                {reviewResult.analysis.problems.map((problem, idx) => (
                  <div key={idx} className="bg-red-50 border border-red-100 rounded-lg p-4">
                    <h4 className="font-medium text-red-700 mb-1">{problem.title}</h4>
                    <p className="text-red-600 text-sm">{problem.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-green-600 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Suggested Improvements
              </h3>
              <div className="space-y-3">
                {reviewResult.analysis.improvements.map((improvement, idx) => (
                  <div key={idx} className="bg-green-50 border border-green-100 rounded-lg p-4">
                    <h4 className="font-medium text-green-700 mb-1">{improvement.title}</h4>
                    <p className="text-green-600 text-sm">{improvement.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Revised Page Structure</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviewResult.pages.map((page, idx) => (
                  <div key={idx} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">{page.name}</h4>
                    <p className="text-gray-600 text-sm mb-3">{page.description}</p>
                    
                    {page.features && page.features.length > 0 && (
                      <div className="mt-2">
                        <h5 className="text-xs font-medium text-gray-500 mb-1">Features:</h5>
                        <div className="flex flex-wrap gap-1">
                          {page.features.map((feature, fidx) => (
                            <span key={fidx} className="text-xs bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            No review data available.
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleAccept}
            disabled={isLoading || !reviewResult}
          >
            Accept Improvements
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}