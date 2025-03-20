import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface VisionRefinementViewProps {
  originalProblem: string;
  enhancedProblem: string;
  originalSolution: string;
  enhancedSolution: string;
  problemImprovements: string;
  solutionImprovements: string;
  onProblemChange: (value: string) => void;
  onSolutionChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
  isLoading: boolean;
}

export function VisionRefinementView({
  originalProblem,
  enhancedProblem,
  originalSolution,
  enhancedSolution,
  problemImprovements,
  solutionImprovements,
  onProblemChange,
  onSolutionChange,
  onBack,
  onNext,
  isLoading
}: VisionRefinementViewProps) {
  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <CardTitle>Improve your problem and solution statements</CardTitle>
        </div>
        <CardDescription className="text-base text-muted-foreground mt-1.5">
          Now that we have selected your target audience, we know more information about the core problem to solve. Review and edit the suggested updates below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-6">
          {/* Problem Statement Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Problem Statement</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Your Input:</Label>
                <p className="text-sm">{originalProblem}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Suggested Update:</Label>
                <div className="p-4 rounded-md border bg-muted/30 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: enhancedProblem }}
                  />
                </div>
                
                {problemImprovements && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Improvements Made:</h4>
                    <p className="text-sm text-muted-foreground">{problemImprovements}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Solution Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Solution</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Your Input:</Label>
                <p className="text-sm">{originalSolution}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Suggested Update:</Label>
                <div className="p-4 rounded-md border bg-muted/30 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: enhancedSolution }}
                  />
                </div>
                
                {solutionImprovements && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Improvements Made:</h4>
                    <p className="text-sm text-muted-foreground">{solutionImprovements}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="gap-2 hover:bg-background"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={onNext}
            disabled={isLoading}
            className="gap-2 shadow-sm hover:shadow-md transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 