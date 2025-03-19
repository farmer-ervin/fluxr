import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

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
  isLoading?: boolean;
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
  isLoading = false
}: VisionRefinementViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-sm border-muted/80">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Vision Refinement</CardTitle>
              <CardDescription className="text-base text-muted-foreground mt-1.5">
                Review and select the enhanced problem and solution statements
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Problem Statement Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Problem Statement</h3>
            <RadioGroup
              value={selectedProblemVersion}
              onValueChange={(value) => onProblemVersionChange(value as 'original' | 'enhanced')}
              className="grid gap-4"
            >
              <div className="flex items-center space-x-4 rounded-lg border p-4">
                <RadioGroupItem value="original" id="problem-original" />
                <Label htmlFor="problem-original" className="flex-grow">
                  <div className="font-medium mb-1">Original</div>
                  <div className="text-muted-foreground">{originalProblem}</div>
                </Label>
              </div>
              <div className="flex items-center space-x-4 rounded-lg border p-4 bg-muted/5">
                <RadioGroupItem value="enhanced" id="problem-enhanced" />
                <Label htmlFor="problem-enhanced" className="flex-grow">
                  <div className="font-medium mb-1 flex items-center gap-2">
                    Enhanced
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-muted-foreground">{enhancedProblem}</div>
                  <div className="mt-4 space-y-2">
                    <div className="text-sm font-medium">Improvements Made:</div>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {problemImprovements.map((improvement, index) => (
                        <li key={index}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Solution Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Solution</h3>
            <RadioGroup
              value={selectedSolutionVersion}
              onValueChange={(value) => onSolutionVersionChange(value as 'original' | 'enhanced')}
              className="grid gap-4"
            >
              <div className="flex items-center space-x-4 rounded-lg border p-4">
                <RadioGroupItem value="original" id="solution-original" />
                <Label htmlFor="solution-original" className="flex-grow">
                  <div className="font-medium mb-1">Original</div>
                  <div className="text-muted-foreground">{originalSolution}</div>
                </Label>
              </div>
              <div className="flex items-center space-x-4 rounded-lg border p-4 bg-muted/5">
                <RadioGroupItem value="enhanced" id="solution-enhanced" />
                <Label htmlFor="solution-enhanced" className="flex-grow">
                  <div className="font-medium mb-1 flex items-center gap-2">
                    Enhanced
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-muted-foreground">{enhancedSolution}</div>
                  <div className="mt-4 space-y-2">
                    <div className="text-sm font-medium">Improvements Made:</div>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {solutionImprovements.map((improvement, index) => (
                        <li key={index}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-4">
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
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 