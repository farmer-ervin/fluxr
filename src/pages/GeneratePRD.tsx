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
import { VisionRefinementView } from '@/components/VisionRefinementView';
import { FeatureGenerationView } from '@/components/FeatureGenerationView';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSupabase } from '@/lib/supabase/supabase-provider';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/lib/providers/user-provider';
import { ProblemDefinitionView } from '@/components/ProblemDefinitionView';
import { SolutionDefinitionView } from '@/components/SolutionDefinitionView';
import { UserFlowGenerationView } from '@/components/UserFlowGenerationView';
import { TechnicalRequirementsView } from '@/components/TechnicalRequirementsView';
import { PRDPreviewView } from '@/components/PRDPreviewView';
import { generateFeaturesPRD } from '@/lib/openai/generate-features';
import { generateUserFlowsPRD } from '@/lib/openai/generate-user-flows';
import { generateTechnicalRequirementsPRD } from '@/lib/openai/generate-technical-requirements';
import { generatePRDPreview } from '@/lib/openai/generate-prd-preview';

// Define database types
type Tables = Database['public']['Tables'];
type OpenAILogInsert = Tables['openai_logs']['Insert'];

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

interface Feature {
  id: string;
  name: string;
  description: string;
  priority: 'must-have' | 'nice-to-have' | 'not-prioritized';
  implementation_status: 'not_started' | 'in_progress' | 'completed';
}

// Update FormData interface to include vision enhancement fields
interface FormData {
  step: 'details' | 'personas' | 'refine' | 'features';
  productName: string;
  problemStatement: string;
  solution: string;
  targetAudience: string;
  personas: CustomerPersona[] | null;
  selectedPersonaIndex: number | null;
  enhancedProblem: string | null;
  enhancedSolution: string | null;
  problemImprovements: string[] | null;
  solutionImprovements: string[] | null;
  selectedProblemVersion: 'original' | 'enhanced' | null;
  selectedSolutionVersion: 'original' | 'enhanced' | null;
  generatedFeatures: {
    id: string;
    name: string;
    description: string;
    priority: 'must-have' | 'nice-to-have' | 'not-prioritized';
    implementation_status: 'not_started' | 'in_progress' | 'completed';
  }[] | null;
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
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isGeneratingFeatures, setIsGeneratingFeatures] = useState(false);

  // Form data with state management
  const [formData, setFormData] = useState<FormData>({
    step: 'details',
    productName: '',
    problemStatement: '',
    solution: '',
    targetAudience: '',
    personas: null,
    selectedPersonaIndex: null,
    enhancedProblem: null,
    enhancedSolution: null,
    problemImprovements: null,
    solutionImprovements: null,
    selectedProblemVersion: null,
    selectedSolutionVersion: null,
    generatedFeatures: null,
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

  // Add handleEnhanceVision function
  const handleEnhanceVision = async () => {
    if (!user) {
      toast.error('You must be logged in to enhance vision');
      return;
    }

    if (formData.selectedPersonaIndex === null || !formData.personas) {
      toast.error('Please select a persona first');
      return;
    }

    setIsLoading(true);
    try {
      const selectedPersona = formData.personas[formData.selectedPersonaIndex];
      
      const requestPayload = {
        productName: formData.productName,
        problemStatement: formData.problemStatement,
        solution: formData.solution,
        targetAudience: formData.targetAudience,
        selectedPersona
      };

      // Log the OpenAI request
      const logData: OpenAILogInsert = {
        user_id: user.id,
        request_type: 'enhance_vision',
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
            content: `You are an expert product strategist specializing in refining product vision and problem-solution statements. Your task is to enhance the existing problem and solution statements by incorporating insights from the selected customer persona.

Your goal is to make the statements more:
- Precise and targeted
- Emotionally resonant with the specific persona
- Actionable and clear
- Aligned with the persona's context and needs

For each enhancement, provide a list of specific improvements made and explain how they better address the persona's needs.`
          },
          {
            role: 'user',
            content: `Please enhance the following problem and solution statements based on the selected customer persona:

Product Name: ${formData.productName}
Current Problem Statement: ${formData.problemStatement}
Current Solution: ${formData.solution}

Selected Persona:
Name: ${selectedPersona.name}
Overview: ${selectedPersona.overview}
Top Pain Point: ${selectedPersona.topPainPoint}
Biggest Frustration: ${selectedPersona.biggestFrustration}
Current Solution: ${selectedPersona.currentSolution}
Key Points:
${selectedPersona.keyPoints.map(point => `- ${point}`).join('\n')}

Don't use the name of the persona (e.g. Steve, John, etc.) in the enhanced problem and solution statements.

Return the response as a JSON object with this structure:
{
  "enhancedProblem": "Enhanced problem statement...",
  "enhancedSolution": "Enhanced solution statement...",
  "problemImprovements": [
    "Specific improvement 1...",
    "Specific improvement 2..."
  ],
  "solutionImprovements": [
    "Specific improvement 1...",
    "Specific improvement 2..."
  ]
}`
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      // Parse and validate the response
      let result;
      try {
        result = JSON.parse(response.choices[0].message.content || '{}');
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
        throw new Error('Failed to parse the AI response. Please try again.');
      }

      // Validate the response structure
      if (!result?.enhancedProblem || !result?.enhancedSolution) {
        console.error('Invalid response structure:', result);
        throw new Error('The AI response was not in the expected format. Please try again.');
      }

      // Update the OpenAI log with the response if we have a log entry
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

      // Update state with enhanced versions and set default selections
      setFormData(prev => ({
        ...prev,
        step: 'refine',
        enhancedProblem: result.enhancedProblem,
        enhancedSolution: result.enhancedSolution,
        problemImprovements: result.problemImprovements,
        solutionImprovements: result.solutionImprovements,
        selectedProblemVersion: 'enhanced',
        selectedSolutionVersion: 'enhanced'
      }));

      toast.success('Successfully enhanced vision statements');
    } catch (error) {
      console.error('Error enhancing vision:', error);
      toast.error('Failed to enhance vision statements. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to generate personas using OpenAI
  const generatePersonas = async () => {
    try {
      if (!user) {
        toast.error('You must be logged in to generate personas');
        return;
      }

      setIsLoading(true);
      
      const requestPayload = {
        productName: formData.productName,
        problemStatement: formData.problemStatement,
        solution: formData.solution,
        targetAudience: formData.targetAudience
      };

      // Log the OpenAI request
      const logData: OpenAILogInsert = {
        user_id: user.id,
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
    } finally {
      setIsLoading(false);
    }
  };

  // Function to generate features
  const generateFeatures = async () => {
    if (!user) {
      toast.error('You must be logged in to generate features');
      return;
    }

    setIsLoading(true);

    try {
      // Determine which problem and solution statements to use
      const finalProblemStatement = formData.selectedProblemVersion === 'enhanced' && formData.enhancedProblem 
        ? formData.enhancedProblem 
        : formData.problemStatement;
        
      const finalSolution = formData.selectedSolutionVersion === 'enhanced' && formData.enhancedSolution 
        ? formData.enhancedSolution 
        : formData.solution;

      // Get the selected persona
      if (!formData.personas || formData.selectedPersonaIndex === null) {
        throw new Error('No persona selected');
      }
      
      const selectedPersona = formData.personas[formData.selectedPersonaIndex];
      
      // Build the request payload
      const requestPayload = {
        productName: formData.productName,
        problemStatement: finalProblemStatement,
        solution: finalSolution,
        targetAudience: formData.targetAudience,
        selectedPersona
      };

      // Log the OpenAI request
      const logData: OpenAILogInsert = {
        user_id: user.id,
        request_type: 'generate_features',
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
            content: `You are an elite product strategist and PRD expert specializing in creating focused, impactful products. Your task is to analyze the product opportunity and define features for the MVP that delivers the maximum value with minimal complexity. MVP features are must haves, while other features are prioritized as nice to have or not prioritized.`
          },
          {
            role: 'user',
            content: `Help me generate features for the MVP version of this product that solves the problem for this customer persona.

Product Name: ${formData.productName}
Problem Statement: ${finalProblemStatement}
Solution: ${finalSolution}
Target Audience: ${formData.targetAudience}

Selected Persona:
Name: ${selectedPersona.name}
Overview: ${selectedPersona.overview}
Top Pain Point: ${selectedPersona.topPainPoint}
Biggest Frustration: ${selectedPersona.biggestFrustration}
Current Solution: ${selectedPersona.currentSolution}
Key Points:
${selectedPersona.keyPoints.map(point => `- ${point}`).join('\n')}

Generate at least 15 features for this product. Features should include:
1. Core MVP features that must be included (prioritized as "must-have")
2. Important but not critical features for a later release (prioritized as "nice-to-have")
3. Additional features that could be considered eventually (prioritized as "not-prioritized")

Include features like authentication, database setup, and other technical requirements in addition to user-facing features.

Return the response as a JSON array with this structure:
[
  {
    "id": "unique-id",
    "name": "Feature Name",
    "description": "Multiple sentence feature description including key functionality and details needed to implement the feature.",
    "priority": "must-have | nice-to-have | not-prioritized",
    "implementation_status": "not_started"
  }
]`
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      // Parse and validate the response
      let result;
      try {
        const content = response.choices[0].message.content || '{}';
        result = JSON.parse(content);
        // Check if the result is an array directly or needs to be extracted
        const features = Array.isArray(result) ? result : (result.features || []);
        
        if (!Array.isArray(features) || features.length === 0) {
          throw new Error('Invalid response format');
        }
        
        // Ensure each feature has an id
        const featuresWithIds = features.map(feature => ({
          ...feature,
          id: feature.id || crypto.randomUUID()
        }));
        
        // Update the form data
        setFormData(prev => ({
          ...prev,
          generatedFeatures: featuresWithIds
        }));
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
        throw new Error('Failed to parse the AI response. Please try again.');
      }

      // Update the OpenAI log with the response if we have a log entry
      if (logEntry) {
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

      toast.success('Successfully generated features');
      return true;
    } catch (error) {
      console.error('Error generating features:', error);
      toast.error('Failed to generate features. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
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
      // Instead of just moving to the next step, call handleEnhanceVision
      if (formData.selectedPersonaIndex === null) {
        toast.error("Please select a persona to continue");
        return;
      }
      // Call handleEnhanceVision which will set the step to 'refine' when complete
      await handleEnhanceVision();
    } else if (formData.step === 'refine') {
      // Save final selections and move to features
      setFormData(prev => ({
        ...prev,
        step: 'features',
        // Use the selected versions for the next steps
        problemStatement: prev.selectedProblemVersion === 'enhanced' && prev.enhancedProblem 
          ? prev.enhancedProblem 
          : prev.problemStatement,
        solution: prev.selectedSolutionVersion === 'enhanced' && prev.enhancedSolution 
          ? prev.enhancedSolution 
          : prev.solution
      }));
      
      // Generate features
      await generateFeatures();
    } else if (formData.step === 'features') {
      // Complete the PRD generation process
      toast.success("PRD generation completed!");
      
      // Prepare to save the PRD
      if (user && formData.generatedFeatures) {
        try {
          // First create a product in the database
          const { data: productData, error: productError } = await supabase
            .from('products')
            .insert({
              name: formData.productName,
              description: formData.problemStatement,
              slug: formData.productName.toLowerCase().replace(/\s+/g, '-'),
              created_by: user.id
            })
            .select()
            .single();
            
          if (productError) throw productError;
          
          if (productData) {
            // Add the user as a member of the product
            await supabase
              .from('product_members')
              .insert({
                product_id: productData.id,
                user_id: user.id,
                role: 'owner'
              });
            
            // Create the PRD
            const { data: prdData, error: prdError } = await supabase
              .from('prds')
              .insert({
                product_id: productData.id,
                problem: formData.problemStatement,
                solution: formData.solution,
                target_audience: formData.targetAudience
              })
              .select()
              .single();
              
            if (prdError) throw prdError;
            
            // Save the features to the database
            if (prdData) {
              const featuresWithProductId = formData.generatedFeatures.map(feature => ({
                ...feature,
                product_id: productData.id
              }));
              
              await supabase
                .from('features')
                .insert(featuresWithProductId);
              
              // Save the selected persona
              if (formData.personas && formData.selectedPersonaIndex !== null) {
                const selectedPersona = formData.personas[formData.selectedPersonaIndex];
                
                await supabase
                  .from('customer_profiles')
                  .insert({
                    product_id: productData.id,
                    name: selectedPersona.name,
                    overview: selectedPersona.overview,
                    is_selected: true,
                    metadata: {
                      topPainPoint: selectedPersona.topPainPoint,
                      biggestFrustration: selectedPersona.biggestFrustration,
                      currentSolution: selectedPersona.currentSolution,
                      keyPoints: selectedPersona.keyPoints,
                      scores: selectedPersona.scores
                    }
                  });
              }
              
              // Navigate to the product page
              navigate(`/product/${productData.slug}/prd`);
            }
          }
        } catch (error) {
          console.error('Error saving PRD:', error);
          toast.error('Failed to save your PRD. Please try again.');
        }
      }
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

  const handleUpdateFeature = (updatedFeature: Feature) => {
    setFormData(prev => ({
      ...prev,
      generatedFeatures: prev.generatedFeatures?.map(feature =>
        feature.id === updatedFeature.id ? updatedFeature : feature
      ) || []
    }));
  };

  const handleDeleteFeature = (featureId: string) => {
    setFormData(prev => ({
      ...prev,
      generatedFeatures: prev.generatedFeatures?.filter(feature =>
        feature.id !== featureId
      ) || []
    }));
  };

  const handleAddFeature = (newFeature: Feature) => {
    setFormData(prev => ({
      ...prev,
      generatedFeatures: [...(prev.generatedFeatures || []), newFeature]
    }));
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
                        onClick={handleNext}
                        disabled={formData.selectedPersonaIndex === null || isLoading}
                        className="gap-2 shadow-sm hover:shadow-md transition-all"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Enhancing...</span>
                          </>
                        ) : (
                          <>
                            Continue
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Problem Refinement with VisionRefinementView */}
          {formData.step === 'refine' && (
            formData.enhancedProblem && formData.enhancedSolution ? (
              <VisionRefinementView
                originalProblem={formData.problemStatement}
                enhancedProblem={formData.enhancedProblem}
                originalSolution={formData.solution}
                enhancedSolution={formData.enhancedSolution}
                problemImprovements={formData.problemImprovements || []}
                solutionImprovements={formData.solutionImprovements || []}
                selectedProblemVersion={formData.selectedProblemVersion || 'enhanced'}
                selectedSolutionVersion={formData.selectedSolutionVersion || 'enhanced'}
                onProblemVersionChange={(version) => setFormData(prev => ({
                  ...prev,
                  selectedProblemVersion: version
                }))}
                onSolutionVersionChange={(version) => setFormData(prev => ({
                  ...prev,
                  selectedSolutionVersion: version
                }))}
                onProblemChange={(version, value) => setFormData(prev => ({
                  ...prev,
                  problemStatement: version === 'original' ? value : prev.problemStatement,
                  enhancedProblem: version === 'enhanced' ? value : prev.enhancedProblem
                }))}
                onSolutionChange={(version, value) => setFormData(prev => ({
                  ...prev,
                  solution: version === 'original' ? value : prev.solution,
                  enhancedSolution: version === 'enhanced' ? value : prev.enhancedSolution
                }))}
                onBack={handleBack}
                onNext={handleNext}
                isLoading={isLoading}
              />
            ) : (
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
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-3 text-muted-foreground">Enhancing your vision...</span>
                  </div>
                </CardContent>
              </Card>
            )
          )}

          {/* Feature Generation View */}
          {formData.step === 'features' && (
            formData.generatedFeatures ? (
              <FeatureGenerationView
                features={formData.generatedFeatures}
                isLoading={isLoading}
                onBack={() => setFormData(prev => ({ ...prev, step: 'refine' }))}
                onNext={handleNext}
                onRegenerateFeatures={generateFeatures}
                onUpdateFeature={handleUpdateFeature}
                onDeleteFeature={handleDeleteFeature}
                onAddFeature={handleAddFeature}
              />
            ) : (
              <Card className="shadow-sm border-muted/80">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <ListChecks className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>Generate Features</CardTitle>
                  </div>
                  <CardDescription className="text-base text-muted-foreground mt-1.5">
                    We're generating features based on your product vision
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-3 text-muted-foreground">Generating features for your MVP...</span>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      </div>
    </div>
  );
} 