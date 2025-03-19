import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface VisionRefinementViewProps {
  originalProblem: string;
  enhancedProblem: string;
  originalSolution: string;
  enhancedSolution: string;
  problemImprovements: string[];
  solutionImprovements: string[];
  selectedProblemVersion: 'original' | 'enhanced';
  selectedSolutionVersion: 'original' | 'enhanced';
  onProblemVersionChange: (version: 'original' | 'enhanced') => void;
  onSolutionVersionChange: (version: 'original' | 'enhanced') => void;
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
  selectedProblemVersion,
  selectedSolutionVersion,
  onProblemVersionChange,
  onSolutionVersionChange,
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
          <CardTitle>Problem Refinement</CardTitle>
        </div>
        <CardDescription className="text-base text-muted-foreground mt-1.5">
          Let's improve your problem statement and solution based on the selected persona.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-6">
          {/* Problem Statement Comparison */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Problem Statement</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="originalProblem"
                    name="problemVersion"
                    checked={selectedProblemVersion === 'original'}
                    onChange={() => onProblemVersionChange('original')}
                    className="h-4 w-4 text-primary"
                  />
                  <label htmlFor="originalProblem" className="font-medium">Original Version</label>
                </div>
                <div className="p-4 rounded-md border bg-muted/30">
                  {originalProblem}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="enhancedProblem"
                    name="problemVersion"
                    checked={selectedProblemVersion === 'enhanced'}
                    onChange={() => onProblemVersionChange('enhanced')}
                    className="h-4 w-4 text-primary"
                  />
                  <label htmlFor="enhancedProblem" className="font-medium">Enhanced Version</label>
                </div>
                <div className="p-4 rounded-md border bg-primary/5">
                  {enhancedProblem}
                </div>
                
                {problemImprovements && problemImprovements.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Improvements Made:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                      {problemImprovements.map((improvement, i) => (
                        <li key={i}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Solution Comparison */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Solution</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="originalSolution"
                    name="solutionVersion"
                    checked={selectedSolutionVersion === 'original'}
                    onChange={() => onSolutionVersionChange('original')}
                    className="h-4 w-4 text-primary"
                  />
                  <label htmlFor="originalSolution" className="font-medium">Original Version</label>
                </div>
                <div className="p-4 rounded-md border bg-muted/30">
                  {originalSolution}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="enhancedSolution"
                    name="solutionVersion"
                    checked={selectedSolutionVersion === 'enhanced'}
                    onChange={() => onSolutionVersionChange('enhanced')}
                    className="h-4 w-4 text-primary"
                  />
                  <label htmlFor="enhancedSolution" className="font-medium">Enhanced Version</label>
                </div>
                <div className="p-4 rounded-md border bg-primary/5">
                  {enhancedSolution}
                </div>
                
                {solutionImprovements && solutionImprovements.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Improvements Made:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                      {solutionImprovements.map((improvement, i) => (
                        <li key={i}>{improvement}</li>
                      ))}
                    </ul>
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