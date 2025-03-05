import React from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export type FlowPattern = 'auto' | 'linear';

interface FlowPatternOption {
  value: FlowPattern;
  title: string;
  description: string;
  imageUrl: string;
  examples: string[];
}

const flowPatternOptions: FlowPatternOption[] = [
  {
    value: 'auto',
    title: 'Auto-detect',
    description: 'The AI will analyze your product and automatically determine the best flow pattern.',
    imageUrl: 'https://cdn.jsdelivr.net/gh/lucide-icons/lucide/icons/git-branch.svg',
    examples: [
      'Complex applications with multiple user journeys',
      'Products that combine different interaction patterns',
      'When you\'re unsure which pattern best fits your needs'
    ]
  },
  {
    value: 'linear',
    title: 'Linear Flow',
    description: 'Pages arranged in a straight line from left to right. Ideal for step-by-step processes like checkouts or onboarding.',
    imageUrl: 'https://cdn.jsdelivr.net/gh/lucide-icons/lucide/icons/arrow-right.svg',
    examples: [
      'Checkout processes',
      'User onboarding flows',
      'Form wizards',
      'Sequential tutorials'
    ]
  }
];

interface FlowPatternDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPattern: FlowPattern;
  onSelectPattern: (pattern: FlowPattern) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function FlowPatternDialog({
  isOpen,
  onClose,
  selectedPattern,
  onSelectPattern,
  onConfirm,
  isLoading = false
}: FlowPatternDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Flow Pattern</DialogTitle>
          <DialogDescription>
            Choose a flow pattern for your user journey. The AI will generate pages and arrange them according to this pattern.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {flowPatternOptions.map((pattern) => (
            <div
              key={pattern.value}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                selectedPattern === pattern.value
                  ? 'border-brand-purple bg-brand-purple/5 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSelectPattern(pattern.value)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={pattern.imageUrl} 
                    alt="" 
                    className={`w-6 h-6 ${
                      selectedPattern === pattern.value ? 'text-brand-purple' : 'text-gray-600'
                    }`}
                  />
                  <h3 className="font-medium text-gray-900">{pattern.title}</h3>
                </div>
                {selectedPattern === pattern.value && (
                  <CheckCircle className="w-5 h-5 text-brand-purple flex-shrink-0" />
                )}
              </div>
              
              <p className="text-sm text-gray-600 mt-3">{pattern.description}</p>
              
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Best for:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {pattern.examples.map((example, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-gray-400" />
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="aspect-video w-full bg-white rounded border border-gray-300 flex items-center justify-center">
                  <img 
                    src={pattern.imageUrl} 
                    alt={`${pattern.title} layout example`}
                    className={`w-12 h-12 ${
                      selectedPattern === pattern.value ? 'text-brand-purple' : 'text-gray-400'
                    }`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="secondary" 
            onClick={onConfirm} 
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </span>
            ) : (
              'Generate Flow'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}