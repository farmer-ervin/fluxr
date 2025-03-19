import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Sparkles, ArrowRight, FileText, Users, ListChecks, Star, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/components/auth/AuthProvider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { openai } from '@/lib/openai';
import { supabase } from '@/lib/supabase';
import { Database, Json } from '@/lib/database.types';

interface CustomerPersona {
  name: string;
  overview: string;
  topPainPoint: string;
  biggestFrustration: string;
  currentSolution: string;
  keyPoints: string[];
  scores: {
    problemMatch: number;
    urgencyToSolve: number;
    abilityToPay: number;
  };
}

interface FormData {
  step: 'details' | 'personas' | 'refine' | 'features';
  productName: string;
  problemStatement: string;
  solution: string;
  targetAudience: string;
  personas: CustomerPersona[] | null;
  selectedPersonaIndex: number | null;
  id?: string; // For saving/resuming drafts
}

// Storage key for localStorage
const STORAGE_KEY = 'fluxr_prd_draft';

// Update the steps array with the requested names
const steps = [
  {
    id: 'details',
    title: "Initial Product Details",
    icon: FileText
  },
  {
    id: 'personas',
    title: "Customer Persona Definition",
    icon: Users
  },
  {
    id: 'refine',
    title: "Problem & Solution Refinement",
    icon: Sparkles
  },
  {
    id: 'features',
    title: "Generate & Prioritize Features",
    icon: ListChecks
  }
];

// Replace the ProgressSteps component with a vertical sidebar
function StepsSidebar({ currentStep }: { currentStep: FormData['step'] }) {
  // Get index for completed steps logic
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  
  return (
    <div className="bg-slate-50 p-6 rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Steps</h2>
      </div>
      <div className="relative">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = index < currentStepIndex;
          
          return (
            <div key={index} className="relative">
              {index > 0 && (
                <div 
                  className={cn(
                    "absolute left-[18px] -top-4 h-8 w-0.5", 
                    index <= currentStepIndex ? "bg-green-500" : "bg-gray-200"
                  )}
                />
              )}
              <div className="flex items-center gap-3 py-4">
                <div className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  isCompleted 
                    ? "bg-green-100" 
                    : isActive 
                      ? "bg-blue-500" 
                      : "bg-gray-100"
                )}>
                  {isCompleted ? (
                    <div className="text-green-500">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.75 12.75L10 15.25L16.25 8.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  ) : isActive ? (
                    <div className="h-3 w-3 rounded-full bg-white" />
                  ) : (
                    <div className="h-3 w-3 rounded-full bg-gray-400" />
                  )}
                </div>
                <div className={cn(
                  "font-medium",
                  isActive ? "text-blue-500" : isCompleted ? "text-green-600" : "text-gray-500"
                )}>
                  {step.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScoreDisplay({ score, label }: { score: number; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}:</span>
        <span className="text-sm font-medium">{score.toFixed(1)}/10</span>
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              i < score ? "bg-primary" : "bg-primary/20"
            )}
          />
        ))}
      </div>
    </div>
  );
}

function PersonaCard({ 
  persona, 
  isSelected, 
  onClick 
}: { 
  persona: CustomerPersona; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  const averageScore = Math.round(
    (persona.scores.problemMatch + 
     persona.scores.urgencyToSolve + 
     persona.scores.abilityToPay) / 3 * 10
  ) / 10;

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all hover:shadow-md",
        isSelected ? "ring-2 ring-primary shadow-blue-glow" : "hover:border-primary/50",
        "cursor-pointer group"
      )}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardHeader>
        <div className="space-y-1.5">
          <div className="flex items-start justify-between">
            <CardTitle>{persona.name}</CardTitle>
            <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 shrink-0">
              <Star className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-medium text-primary">{averageScore.toFixed(1)}/10</span>
            </div>
          </div>
          <CardDescription className="mt-1.5">{persona.overview}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-medium">Problems</h4>
            <div className="space-y-3 rounded-lg border bg-muted/50 p-3 text-sm">
              <div>
                <span className="font-medium">Top Pain Point: </span>
                <span className="text-muted-foreground">{persona.topPainPoint}</span>
              </div>
              <div>
                <span className="font-medium">Biggest Frustration: </span>
                <span className="text-muted-foreground">{persona.biggestFrustration}</span>
              </div>
              <div>
                <span className="font-medium">Current Solution: </span>
                <span className="text-muted-foreground">{persona.currentSolution}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-medium">Key Points</h4>
            <ul className="list-inside space-y-1.5 text-sm text-muted-foreground">
              {persona.keyPoints.map((point, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-primary">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="mb-2 text-sm font-medium">Persona Fit</h4>
          <ScoreDisplay score={persona.scores.problemMatch} label="Problem Match" />
          <ScoreDisplay score={persona.scores.urgencyToSolve} label="Urgency to Solve" />
          <ScoreDisplay score={persona.scores.abilityToPay} label="Ability to Pay" />
        </div>
      </CardContent>
    </Card>
  );
}

export function GeneratePRD() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);

  // Form data with state management
  const [formData, setFormData] = useState<FormData>({
    step: 'details',
    productName: '',
    problemStatement: '',
    solution: '',
    targetAudience: '',
    personas: null,
    selectedPersonaIndex: null,
    id: crypto.randomUUID() // Generate a unique ID for this draft
  });

  // Refs for scrolling
  const detailsRef = useRef<HTMLDivElement>(null);
  const personasRef = useRef<HTMLDivElement>(null);

  // Scroll management
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Load saved draft on initial render
  useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft) as FormData;
        setFormData(parsedDraft);
        setDraftSaved(true);
        toast.info("Loaded saved draft");
      } catch (err) {
        console.error("Failed to parse saved draft:", err);
      }
    }
  }, []);

  // Save draft to localStorage whenever formData changes
  useEffect(() => {
    const saveToLocalStorage = () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      setDraftSaved(true);
    };

    const debounceTimer = setTimeout(saveToLocalStorage, 2000);
    return () => clearTimeout(debounceTimer);
  }, [formData]);

  // Handle persona selection
  const handlePersonaSelect = (index: number) => {
    setFormData(prev => ({
      ...prev,
      selectedPersonaIndex: index
    }));
  };

  // Navigation between steps
  const handleBack = () => {
    if (formData.step === 'personas') {
      setFormData(prev => ({
        ...prev,
        step: 'details'
      }));
      scrollToSection(detailsRef);
    } else if (formData.step === 'refine') {
      setFormData(prev => ({
        ...prev,
        step: 'personas'
      }));
      scrollToSection(personasRef);
    } else if (formData.step === 'details') {
      navigate('/product/create');
    }
  };

  // Handle progression to next step
  const handleNext = async () => {
    if (formData.step === 'details') {
      // Move from details to personas
      setIsLoading(true);
      try {
        // Generate personas using OpenAI
        await generatePersonas();
      } catch (error) {
        toast.error("Failed to generate personas. Please try again.");
        console.error("Error generating personas:", error);
      } finally {
        setIsLoading(false);
      }
    } else if (formData.step === 'personas') {
      // Move from personas to refinement
      if (formData.selectedPersonaIndex === null) {
        toast.error("Please select a persona to continue");
        return;
      }
      setFormData(prev => ({
        ...prev,
        step: 'refine'
      }));
    } else if (formData.step === 'refine') {
      // Move from refinement to features
      setFormData(prev => ({
        ...prev,
        step: 'features'
      }));
    } else if (formData.step === 'features') {
      // Complete the PRD generation process
      toast.success("PRD generation completed!");
      // Here you would normally save the final PRD or navigate to a summary/completion page
    }
  };

  // Function to generate personas using OpenAI
  const generatePersonas = async () => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        toast.error('You must be logged in to generate personas');
        return;
      }
      
      const requestPayload = {
        productName: formData.productName,
        problemStatement: formData.problemStatement,
        solution: formData.solution,
        targetAudience: formData.targetAudience
      };

      // Log the OpenAI request
      const logData = {
        user_id: user.data.user.id,
        request_type: 'generate_personas',
        model: 'gpt-4o',
        request_payload: requestPayload as unknown as Json,
        response_payload: null,
        error: null,
        input_tokens: null,
        output_tokens: null
      };

      // Create log entry
      const { data: logEntry, error: logError } = await supabase
        .from('openai_logs')
        .insert(logData)
        .select()
        .single();

      if (logError) {
        console.error('Failed to create OpenAI log entry:', logError);
        // Continue anyway
      }

      // Make the OpenAI call
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert in customer persona development and market research. Your task is to generate 3 distinct customer personas based on the provided product information. Each persona should be realistic, detailed, and aligned with the product's target market.`
          },
          {
            role: 'user',
            content: `Generate 3 detailed customer personas for the following product:

Product Name: ${formData.productName}
Problem Statement: ${formData.problemStatement}
Solution: ${formData.solution}
Target Audience: ${formData.targetAudience}

For each persona, provide:
1. A descriptive name/title (e.g., "Digital Nomad", "Startup Founder")
2. A 2-sentence overview of who they are
3. Their problems:
   - Top Pain Point
   - Biggest Frustration
   - How They Solve It Today
4. 5 key points about their role and daily life
5. Profile scores (1-10):
   - Problem Match
   - Urgency to Solve
   - Ability to Pay

The average of the profile scores cannot be the same for all personas.

Return the response as a JSON object with exactly this structure:
{
  "personas": [{
    "name": string,
    "overview": string,
    "topPainPoint": string,
    "biggestFrustration": string,
    "currentSolution": string,
    "keyPoints": string[],
    "scores": {
      "problemMatch": number,
      "urgencyToSolve": number,
      "abilityToPay": number
    }
  }]
}`
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });
      
      // Update the log with the response if we have a log entry
      if (logEntry?.id) {
        const updateData = {
          response_payload: response.choices[0].message.content as unknown as Json,
          input_tokens: response.usage?.prompt_tokens ?? null,
          output_tokens: response.usage?.completion_tokens ?? null
        };

        await supabase
          .from('openai_logs')
          .update(updateData)
          .eq('id', logEntry.id);
      }

      // Parse and validate the response
      let result;
      try {
        result = JSON.parse(response.choices[0].message.content || '{}');
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
        throw new Error('Failed to parse the AI response. Please try again.');
      }

      // Validate the response structure
      if (!result?.personas || !Array.isArray(result.personas) || result.personas.length === 0) {
        console.error('Invalid response structure:', result);
        throw new Error('The AI response was not in the expected format. Please try again.');
      }

      // Update state with the personas and move to next step
      setFormData(prev => ({
        ...prev,
        personas: result.personas,
        step: 'personas'
      }));

      // Scroll to personas section after state updates
      setTimeout(() => {
        if (personasRef.current) {
          personasRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

      toast.success("Generated personas successfully");
    } catch (error) {
      console.error('Error generating personas:', error);
      throw error; // Re-throw for the caller to handle
    }
  };

  // Handle saving and exiting
  const handleSaveAndExit = () => {
    // Save is already handled by useEffect
    toast.success("Progress saved");
    navigate('/products');
  };

  // Clear the draft
  const handleClearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setDraftSaved(false);
    toast.success("Draft cleared");
    navigate('/product/create');
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/product/create')}
          className="rounded-full hover:bg-background"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generate PRD with AI</h1>
          <p className="text-muted-foreground mt-1">
            We'll walk you through step by step to create a comprehensive PRD
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleSaveAndExit}
            className="gap-2"
          >
            Save & Exit
          </Button>
          {draftSaved && (
            <Button 
              variant="ghost" 
              onClick={handleClearDraft}
              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
            >
              Clear Draft
            </Button>
          )}
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Left column - Steps sidebar */}
        <div className="md:col-span-1">
          <StepsSidebar currentStep={formData.step} />
        </div>
        
        {/* Right column - Current step content */}
        <div className="md:col-span-3">
          {/* Product Details Form */}
          {formData.step === 'details' && (
            <div ref={detailsRef} className="flex flex-col gap-6">
              <Card className="shadow-sm border-muted/80">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>Product Details</CardTitle>
                  </div>
                  <CardDescription className="text-base text-muted-foreground mt-1.5">
                    Start by telling Fluxr about your product idea. Please include the most important details, but Fluxr's AI will help fill in the gaps.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-5">
                    <div className="grid gap-2">
                      <Label htmlFor="productName" className="font-medium">
                        Product Name
                      </Label>
                      <Input
                        id="productName"
                        value={formData.productName}
                        onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                        placeholder="Enter your product name"
                        className="transition-shadow focus-visible:shadow-blue-glow"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="problemStatement" className="font-medium">
                        Problem Statement
                      </Label>
                      <Textarea
                        id="problemStatement"
                        value={formData.problemStatement}
                        onChange={(e) => setFormData(prev => ({ ...prev, problemStatement: e.target.value }))}
                        placeholder="What is the core problem you are solving?"
                        className="min-h-[100px] transition-shadow focus-visible:shadow-blue-glow"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="solution" className="font-medium">
                        Solution
                      </Label>
                      <Textarea
                        id="solution"
                        value={formData.solution}
                        onChange={(e) => setFormData(prev => ({ ...prev, solution: e.target.value }))}
                        placeholder="How does your product solve this problem?"
                        className="min-h-[100px] transition-shadow focus-visible:shadow-blue-glow"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="targetAudience" className="font-medium">
                        Target Audience
                      </Label>
                      <Textarea
                        id="targetAudience"
                        value={formData.targetAudience}
                        onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                        placeholder="Who are you solving this problem for?"
                        className="min-h-[100px] transition-shadow focus-visible:shadow-blue-glow"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleNext}
                      disabled={!formData.productName || !formData.problemStatement || !formData.solution || !formData.targetAudience || isLoading}
                      className="gap-2 shadow-sm hover:shadow-md transition-all"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
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
            </div>
          )}

          {/* Customer Personas Section */}
          {formData.step === 'personas' && formData.personas && (
            <div ref={personasRef} className="flex flex-col gap-6">
              <Card className="shadow-sm border-muted/80">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Customer Personas</CardTitle>
                      <CardDescription className="text-base text-muted-foreground mt-1.5">
                        Select the persona that best represents your target customer
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid gap-6 md:grid-cols-3 w-full mx-auto">
                    {formData.personas.map((persona, index) => (
                      <PersonaCard
                        key={index}
                        persona={persona}
                        isSelected={formData.selectedPersonaIndex === index}
                        onClick={() => handlePersonaSelect(index)}
                      />
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      className="gap-2 hover:bg-background"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsLoading(true);
                          generatePersonas()
                            .then(() => setIsLoading(false))
                            .catch(error => {
                              toast.error("Failed to regenerate personas");
                              console.error(error);
                              setIsLoading(false);
                            });
                        }}
                        disabled={isLoading}
                        className="gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Regenerating...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4" />
                            <span>Regenerate</span>
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            step: 'refine'
                          }));
                        }}
                        disabled={formData.selectedPersonaIndex === null || isLoading}
                        className="gap-2 shadow-sm hover:shadow-md transition-all"
                      >
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Placeholder for Problem Refinement */}
          {formData.step === 'refine' && (
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
              <CardContent>
                <div className="flex justify-between items-center gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setFormData(prev => ({ ...prev, step: 'personas' }))}
                    className="gap-2 hover:bg-background"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setFormData(prev => ({ ...prev, step: 'features' }))}
                    className="gap-2 shadow-sm hover:shadow-md transition-all"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Placeholder for Feature Generation */}
          {formData.step === 'features' && (
            <Card className="shadow-sm border-muted/80">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <ListChecks className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Generate Features</CardTitle>
                </div>
                <CardDescription className="text-base text-muted-foreground mt-1.5">
                  Generate and prioritize key features for your product.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setFormData(prev => ({ ...prev, step: 'refine' }))}
                    className="gap-2 hover:bg-background"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    className="gap-2 shadow-sm hover:shadow-md transition-all"
                  >
                    Finish
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 