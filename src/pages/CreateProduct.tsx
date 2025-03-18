import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Sparkles, ArrowRight, FileText, Users, ListChecks, Star, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { openai } from '@/lib/openai';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { normalizeFeature } from '@/lib/utils/featureNormalizer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Database, Json } from '@/lib/database.types';
import { PostgrestSingleResponse } from '@supabase/supabase-js';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Tables = Database['public']['Tables'];
type OpenAILog = Tables['openai_logs']['Insert'];
type Product = Tables['products']['Insert'];
type PRD = Tables['prds']['Insert'];
type Feature = Tables['features']['Insert'];

type OpenAILogRow = Tables['openai_logs']['Row'];
type ProductRow = Tables['products']['Row'];
type PRDRow = Tables['prds']['Row'];

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

interface AiFormData {
  step: 'details' | 'personas' | 'vision' | 'features';
  productName: string;
  problemStatement: string;
  solution: string;
  targetAudience: string;
  personas: CustomerPersona[] | null;
  selectedPersonaIndex: number | null;
}

const steps = [
  {
    title: "Collect Baseline Information",
    description: "Start with the fundamentals of your product idea",
    icon: FileText
  },
  {
    title: "Define Your Target Audience",
    description: "We'll help you identify and understand your ideal users",
    icon: Users
  },
  {
    title: "Refine Your Vision",
    description: "Get AI-powered suggestions to improve your problem statement and solution",
    icon: Sparkles
  },
  {
    title: "Generate & Prioritize Features",
    description: "We'll help you identify key features and organize them effectively",
    icon: ListChecks
  }
];

function ScoreDisplay({ score, label }: { score: number; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}:</span>
        <span className="text-sm font-medium">{score}/10</span>
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

function ProgressSteps({ currentStep }: { currentStep: AiFormData['step'] }) {
  const stepIndex = {
    'details': 0,
    'personas': 1,
    'vision': 2,
    'features': 3
  }[currentStep];

  return (
    <div className="mb-8 relative">
      <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-border" />
      <div
        className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-primary transition-all duration-500"
        style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
      />
      <div className="relative z-10 flex justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index <= stepIndex;
          const isComplete = index < stepIndex;
          
          return (
            <div
              key={index}
              className={cn(
                "flex flex-col items-center gap-2",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-background transition-all duration-300",
                  isActive 
                    ? "border-primary shadow-sm" 
                    : "border-muted",
                  isComplete && "bg-primary/10"
                )}
              >
                {isComplete ? (
                  <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <ArrowRight className="h-3 w-3" />
                  </div>
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <div className="space-y-1 text-center">
                <p className={cn(
                  "text-sm font-medium leading-none",
                  isActive && "text-foreground"
                )}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground max-w-[120px] hidden md:block">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
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
     persona.scores.abilityToPay) / 3
  );

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:border-primary/50 hover:shadow-md",
        isSelected && "border-primary shadow-blue-glow"
      )}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{persona.name}</CardTitle>
            <CardDescription className="mt-1.5">{persona.overview}</CardDescription>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1">
            <Star className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-medium text-primary">{averageScore}/10</span>
          </div>
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
          <ScoreDisplay score={persona.scores.problemMatch} label="Problem Match" />
          <ScoreDisplay score={persona.scores.urgencyToSolve} label="Urgency to Solve" />
          <ScoreDisplay score={persona.scores.abilityToPay} label="Ability to Pay" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CreateProduct() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState<'upload' | 'generate' | null>(null);
  const [prdContent, setPrdContent] = useState('');
  const [productName, setProductName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<AiFormData>({
    step: 'details',
    productName: '',
    problemStatement: '',
    solution: '',
    targetAudience: '',
    personas: null,
    selectedPersonaIndex: null
  });

  const [showForm, setShowForm] = useState(false);

  // Refs for scrolling
  const optionsRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);
  const generateRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const personasRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleOptionSelect = (option: 'upload' | 'generate') => {
    setSelectedOption(option);
    
    // Use setTimeout to ensure state is updated before scrolling
    setTimeout(() => {
      if (option === 'upload') {
        scrollToSection(uploadRef);
      } else {
        scrollToSection(generateRef);
      }
    }, 100);
  };

  const handleStartGenerating = () => {
    setShowForm(true);
    setTimeout(() => {
      scrollToSection(detailsRef);
    }, 100);
  };

  const handlePersonaSelect = (index: number) => {
    setFormData(prev => ({
      ...prev,
      selectedPersonaIndex: index
    }));
  };

  const handleBack = () => {
    if (formData.step === 'personas') {
      setFormData(prev => ({
        ...prev,
        step: 'details',
        personas: null,
        selectedPersonaIndex: null
      }));
      scrollToSection(detailsRef);
    } else {
      setShowForm(false);
      scrollToSection(generateRef);
    }
  };

  const handleNext = async () => {
    if (formData.step === 'details') {
      setIsLoading(true);
      try {
        await handleGeneratePersonas();
        setFormData(prev => ({
          ...prev,
          step: 'personas'
        }));
        setTimeout(() => {
          scrollToSection(personasRef);
        }, 100);
      } catch (error) {
        console.error('Error generating personas:', error);
        toast.error('Failed to generate personas. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUploadPrd = async () => {
    if (!prdContent.trim()) {
      setError('Please paste your PRD content first');
      return;
    }

    if (!productName.trim()) {
      setError('Please enter a product name');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Log the OpenAI call
      const logEntry = {
        user_id: user?.id,
        request_type: 'parse_prd',
        model: 'gpt-4o-mini',
        request_payload: { prd_content: prdContent.substring(0, 500) + '...' } // Truncate for logging
      };

      // Make the OpenAI call with improved prompt
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a PRD parser that extracts structured content from PRD documents. 
            Parse the provided PRD text and extract content for the following standard sections:
            1. Product Description (high-level overview)
            2. Problem
            3. Solution
            4. Target Audience
            5. Features (with name, description, priority, and implementation_status)

            You must include all the details from the PRD. Do not summarize or truncate the PRD.

            Additionally, identify any other sections in the PRD that don't fit into these standard categories and extract them as custom sections.
            
            Return the parsed content as a JSON object with the following structure:
            {
              "product_description": "...",
              "problem": "...",
              "solution": "...",
              "target_audience": "...",
              "features": [
                {
                  "name": "Feature name",
                  "description": "Feature description",
                  "priority": "must-have" | "nice-to-have" | "not-prioritized",
                  "implementation_status": "not_started"
                }
              ],
              "custom_sections": {
                "custom_section_name_1": "section content 1",
                "custom_section_name_2": "section content 2"
              }
            }
            
            CRITICAL FEATURE REQUIREMENTS:
            1. Each feature MUST have a name and description
            2. Priority MUST be one of: "must-have", "nice-to-have", "not-prioritized"
            3. Implementation status MUST be "not_started" unless explicitly stated
            4. Features without a priority should be marked as "not-prioritized"
            5. Features without a status should be marked as "not_started"
            
            For custom section names:
            1. Prefix with "custom_"
            2. Convert to lowercase with underscores
            3. Remove special characters`
          },
          {
            role: 'user',
            content: prdContent
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      // Update the log with the response
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const logResponse = await supabase
        .from('openai_logs')
        .insert({
          user_id: user.id,
          request_type: 'prd_generation',
          model: 'gpt-4o-mini',
          request_payload: {
            messages: response.choices[0].message.content,
            model: 'gpt-4o-mini',
            temperature: 0.7,
            max_tokens: 2000,
          },
          response_payload: response.choices[0].message.content,
          input_tokens: response.usage?.prompt_tokens,
          output_tokens: response.usage?.completion_tokens,
        } as OpenAILog)
        .select()
        .single();

      // Parse and normalize the response
      const parsedData = JSON.parse(response.choices[0].message.content || '{}');
      
      // Normalize features if they exist
      if (parsedData.features && Array.isArray(parsedData.features)) {
        parsedData.features = parsedData.features.map(normalizeFeature);
      }

      // First create a new product with the user-provided name and parsed description
      const productResponse = await supabase
        .from('products')
        .insert({
          name: productName.trim(),
          description: parsedData.product_description || '',
          user_id: user.id,
        } as Product)
        .select()
        .single();

      if (!productResponse.data) {
        throw new Error('Failed to create product');
      }

      // Create initial PRD record with parsed data
      const prdResponse = await supabase
        .from('prds')
        .insert({
          product_id: productResponse.data.id,
          problem: parsedData.problem || '',
          solution: parsedData.solution || '',
          target_audience: parsedData.target_audience || '',
          tech_stack: '',
          success_metrics: '',
          custom_sections: parsedData.custom_sections || {}
        } as PRD)
        .select()
        .single();

      if (!prdResponse.data) {
        throw new Error('Failed to create PRD');
      }

      // If there are features, create them
      if (parsedData.features && Array.isArray(parsedData.features)) {
        const features = parsedData.features.map((feature: any) => ({
          product_id: productResponse.data.id,
          name: feature.name || '',
          description: feature.description || null,
          priority: feature.priority || 'not-prioritized',
          implementation_status: 'not_started',
        } as Feature));

        if (features.length > 0) {
          await supabase.from('features').insert(features);
        }
      }

      // Navigate to the PRD editor
      navigate(`/product/${productResponse.data.slug}/prd`);

    } catch (error) {
      console.error('Error creating product:', error);
      setError('Failed to create product. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGenerateWithAi = () => {
    // This will be implemented in the next step
    console.log('AI form data:', formData);
  };

  const handleGeneratePersonas = async () => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;

    try {
      // Log the OpenAI request
      const openaiLogResponse = await supabase.from('openai_logs').insert({
        user_id: user.data.user.id,
        request_type: 'generate_personas',
        model: 'gpt-4o',
        request_payload: {
          productName: formData.productName,
          problemStatement: formData.problemStatement,
          solution: formData.solution,
          targetAudience: formData.targetAudience
        }
      }).select('id').single();

      // Make the OpenAI call
      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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

The personas should be different enough to represent distinct segments of the target market, but all should be realistic potential users of the product.

Format the response as a JSON array with 3 objects, each containing:
{
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
}`
            }
          ]
        })
      });

      const data = await response.json();
      
      // Update the OpenAI log with the response
      if (openaiLogResponse.data?.id) {
        await supabase.from('openai_logs').update({
          response_payload: data,
          completed_at: new Date().toISOString()
        }).eq('id', openaiLogResponse.data.id);
      }

      // Parse the response and update state
      const personas: CustomerPersona[] = JSON.parse(data.choices[0].message.content);
      setFormData(prev => ({
        ...prev,
        step: 'personas',
        personas
      }));

    } catch (error) {
      console.error('Error generating personas:', error);
      toast.error('Failed to generate customer personas. Please try again.');
    }
  };

  return (
    <div className="container max-w-5xl py-8 space-y-16">
      {/* Header and Options Section */}
      <div ref={optionsRef} className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/products')}
            className="rounded-full hover:bg-background"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Product</h1>
            <p className="text-muted-foreground mt-1">
              Choose how you'd like to start defining your product
            </p>
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Upload PRD Option */}
          <Card className={cn(
            "relative overflow-hidden transition-all hover:shadow-md",
            selectedOption === 'upload' ? 'ring-2 ring-primary shadow-blue-glow' : 'hover:border-primary/50',
            "cursor-pointer group"
          )}
          onClick={() => handleOptionSelect('upload')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2.5">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Upload Existing PRD</CardTitle>
              </div>
              <CardDescription className="text-base">
                Already have a PRD? Paste it here and we'll automatically format it for you.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Generate with AI Option */}
          <Card className={cn(
            "relative overflow-hidden transition-all hover:shadow-md",
            selectedOption === 'generate' ? 'ring-2 ring-primary shadow-blue-glow' : 'hover:border-primary/50',
            "cursor-pointer group"
          )}
          onClick={() => handleOptionSelect('generate')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2.5">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Generate with AI</CardTitle>
              </div>
              <CardDescription className="text-base">
                Fill in the key details about your product, and we'll help you generate a comprehensive PRD.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Upload PRD Section */}
      {selectedOption === 'upload' && (
        <div ref={uploadRef} className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedOption(null);
                scrollToSection(optionsRef);
              }}
              className="gap-2 hover:bg-background"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Options
            </Button>
          </div>
          <Card className="shadow-sm border-muted/80">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Upload Your PRD</CardTitle>
                  <CardDescription>
                    Enter your product name and paste your existing PRD content below.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="productName">Product Name</Label>
                  <Input
                    id="productName"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Enter your product name"
                    className="transition-shadow focus-visible:shadow-blue-glow"
                  />
                </div>
                <div>
                  <Label htmlFor="prdContent">PRD Content</Label>
                  <Textarea
                    id="prdContent"
                    value={prdContent}
                    onChange={(e) => setPrdContent(e.target.value)}
                    placeholder="Paste your PRD content here..."
                    className="min-h-[300px] transition-shadow focus-visible:shadow-blue-glow resize-none"
                  />
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <p>{error}</p>
                </div>
              )}
              <div className="flex justify-end gap-4 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedOption(null);
                    scrollToSection(optionsRef);
                  }}
                  disabled={isLoading}
                  className="hover:bg-background"
                >
                  Back
                </Button>
                <Button
                  onClick={handleUploadPrd}
                  disabled={isLoading || !prdContent.trim() || !productName.trim()}
                  className="gap-2 shadow-sm hover:shadow-md transition-all"
                >
                  {isLoading ? (
                    <>
                      <Upload className="h-4 w-4 animate-spin" />
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
        </div>
      )}

      {/* Generate with AI Section */}
      {selectedOption === 'generate' && (
        <div ref={generateRef} className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedOption(null);
                scrollToSection(optionsRef);
              }}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Options
            </Button>
          </div>

          <ProgressSteps currentStep={formData.step} />

          {/* Generate with AI Card */}
          <Card className={cn(
            "transition-all duration-500",
            showForm && "opacity-80"
          )}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Generate with AI</CardTitle>
                  <CardDescription>Let's create your PRD step by step with AI assistance.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-muted/50 p-6 space-y-6">
                <h3 className="text-base font-medium">How AI Will Help You</h3>
                <div className="space-y-5">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div key={index} className="flex gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium">{step.title}</p>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {!showForm && (
                <div className="mt-6 flex justify-end">
                  <Button onClick={handleStartGenerating} className="gap-2 shadow-sm hover:shadow-md transition-all">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Details Form */}
          {showForm && (
            <div ref={detailsRef} className="flex flex-col gap-6">
              <Card className="shadow-sm border-muted/80">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Product Details</CardTitle>
                      <CardDescription>Tell us about your product idea</CardDescription>
                    </div>
                  </div>
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
                        placeholder="What problem does your product solve?"
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
                        placeholder="Who is your target audience?"
                        className="min-h-[100px] transition-shadow focus-visible:shadow-blue-glow"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between pt-2">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      className="gap-2 hover:bg-background"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={!formData.productName || !formData.problemStatement || !formData.solution || !formData.targetAudience || isLoading}
                      className="gap-2 shadow-sm hover:shadow-md transition-all"
                    >
                      {isLoading ? (
                        <>
                          <Upload className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          Generate Personas
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
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between border-b pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">Customer Personas</h2>
                  </div>
                  <p className="text-muted-foreground pl-11">
                    Select the persona that best represents your target customer
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="gap-2 hover:bg-background w-fit"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Details
                </Button>
              </div>
              
              <div className="grid gap-6 md:grid-cols-3">
                {formData.personas.map((persona, index) => (
                  <PersonaCard
                    key={index}
                    persona={persona}
                    isSelected={formData.selectedPersonaIndex === index}
                    onClick={() => handlePersonaSelect(index)}
                  />
                ))}
              </div>
              
              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => {/* Handle next step */}}
                  disabled={formData.selectedPersonaIndex === null}
                  className="gap-2 shadow-sm hover:shadow-md transition-all"
                >
                  Continue to Vision
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 