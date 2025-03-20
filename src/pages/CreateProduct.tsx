import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Sparkles, ArrowRight, FileText, Users, ListChecks, Star, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
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
type OpenAILogInsert = Tables['openai_logs']['Insert'];
type OpenAILogUpdate = Tables['openai_logs']['Update'];
type ProductInsert = Tables['products']['Insert'];
type PRDInsert = Tables['prds']['Insert'];
type FeatureInsert = Tables['features']['Insert'];

type OpenAILogRow = Tables['openai_logs']['Row'];
type ProductRow = Tables['products']['Row'];
type PRDRow = Tables['prds']['Row'];
type FeatureRow = Tables['features']['Row'];

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
  step: 'details' | 'personas' | 'features';
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

function ProgressSteps({ currentStep }: { currentStep: AiFormData['step'] }) {
  const stepIndex = {
    'details': 0,
    'personas': 1,
    'features': 2
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
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{persona.name}</CardTitle>
            <CardDescription className="mt-1.5">{persona.overview}</CardDescription>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1">
            <Star className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-medium text-primary">{averageScore.toFixed(1)}/10</span>
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
          <h4 className="mb-2 text-sm font-medium">Persona Fit</h4>
          <ScoreDisplay score={persona.scores.problemMatch} label="Problem Match" />
          <ScoreDisplay score={persona.scores.urgencyToSolve} label="Urgency to Solve" />
          <ScoreDisplay score={persona.scores.abilityToPay} label="Ability to Pay" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Generates a unique slug for a product
 * Uses check-and-increment strategy: first tries the base slug,
 * then adds numeric suffixes until a unique slug is found
 */
const generateUniqueSlug = async (productName: string): Promise<string> => {
  // Generate the base slug
  const baseSlug = productName.trim().toLowerCase().replace(/\s+/g, '-');
  
  // Check if the base slug exists
  let attemptCount = 0;
  const MAX_ATTEMPTS = 100; // Safety limit
  let slugToTry = baseSlug;
  let isUnique = false;
  
  while (!isUnique && attemptCount < MAX_ATTEMPTS) {
    try {
      // Check if the current slug attempt exists in the database
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .match({ slug: slugToTry });
      
      if (error) {
        console.error('Error checking slug uniqueness:', error);
        // Fall back to timestamp approach if there's a database error
        return `${baseSlug}-${Date.now()}`;
      }
      
      // If count is 0, the slug is unique
      if (count === 0) {
        isUnique = true;
      } else {
        // Increment counter and try again
        attemptCount++;
        slugToTry = `${baseSlug}-${attemptCount}`;
      }
    } catch (err) {
      console.error('Error in slug generation:', err);
      // Fall back to timestamp approach if there's an error
      return `${baseSlug}-${Date.now()}`;
    }
  }
  
  // If we hit the max attempts, fall back to timestamp approach
  if (attemptCount >= MAX_ATTEMPTS) {
    return `${baseSlug}-${Date.now()}`;
  }
  
  return slugToTry;
};

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
    navigate('/product/generate-prd');
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
    } else if (formData.step === 'personas') {
      // Navigate to the Generate PRD page
      navigate('/product/generate-prd');
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

      // Check if product name already exists by checking the base slug
      const baseSlug = productName.trim().toLowerCase().replace(/\s+/g, '-');
      const { count, error: slugCheckError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .match({ slug: baseSlug });

      if (slugCheckError) {
        throw new Error('Failed to check product name availability');
      }

      if (count && count > 0) {
        setError('Product name already exists. Please change the product name and try again.');
        setIsLoading(false);
        return;
      }

      // Log the OpenAI call
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
            
            IMPORTANT FORMATTING REQUIREMENTS:
            For main sections (product_description, problem, solution, target_audience, custom_sections):
            - Convert formatting to proper HTML tags:
              * Bold text: <strong> or <b>
              * Italic text: <em> or <i>
              * Bullet points: <ul> and <li>
              * Numbered lists: <ol> and <li>
              * Paragraphs: <p>
              * Line breaks: <br>
            - DO NOT include section headers (e.g., no "Product Overview", "Problem Statement", etc.)
            - Start directly with the content wrapped in appropriate HTML tags
            - Maintain the hierarchy and structure of lists and sections
            - Keep any existing HTML formatting if present in the input
            - Ensure all HTML tags are properly closed
            - Preserve all emojis and special characters in the content
            - For emojis followed by text, keep them together in the same HTML element

            For features:
            - Use plain text only, NO HTML formatting
            - Preserve emojis if present
            - Remove any HTML tags from feature names and descriptions
            - Keep the text content simple and clean

            Return the parsed content as a JSON object with the following structure:
            {
              "product_description": "...", // HTML formatted content without headers
              "problem": "...", // HTML formatted content without headers
              "solution": "...", // HTML formatted content without headers
              "target_audience": "...", // HTML formatted content without headers
              "features": [
                {
                  "name": "Feature name in plain text (with emoji if present)",
                  "description": "Feature description in plain text (with emoji if present)",
                  "priority": "must-have" | "nice-to-have" | "not-prioritized",
                  "implementation_status": "not_started"
                }
              ],
              "custom_sections": {
                "custom_section_name_1": "section content in HTML format without headers",
                "custom_section_name_2": "section content in HTML format without headers"
              }
            }
            
            CRITICAL FEATURE REQUIREMENTS:
            1. Each feature MUST have a name and description in plain text (no HTML)
            2. Priority MUST be one of: "must-have", "nice-to-have", "not-prioritized"
            3. Implementation status MUST be "not_started" unless explicitly stated
            4. Features without a priority should be marked as "not-prioritized"
            5. Features without a status should be marked as "not_started"
            6. Strip any HTML tags from feature names and descriptions
            
            For custom section names:
            1. Prefix with "custom_"
            2. Convert to lowercase with underscores
            3. Remove special characters (but keep emojis in the content)
            4. DO NOT include the section name in the content

            Example of formatted output:
            {
              "product_description": "<p>Our innovative solution helps users accomplish their goals through an intuitive interface...</p><ul><li>✨ <strong>Key Point 1:</strong> Important detail</li></ul>",
              "problem": "<p>Users face several challenges:</p><ul><li>🔥 Challenge 1</li><li>⚠️ Challenge 2</li></ul>",
              "features": [{
                "name": "⚡️ Quick Search",
                "description": "🔍 Instantly find what you need with our powerful search feature",
                "priority": "must-have",
                "implementation_status": "not_started"
              }],
              "custom_sections": {
                "custom_tech_stack": "<ul><li>Frontend: React Native</li><li>Backend: Node.js</li></ul>"
              }
            }`
          },
          {
            role: 'user',
            content: prdContent
          }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      // Parse and normalize the response
      const parsedData = JSON.parse(response.choices[0].message.content || '{}');
      
      // Normalize features if they exist
      if (parsedData.features && Array.isArray(parsedData.features)) {
        parsedData.features = parsedData.features.map(normalizeFeature);
      }

      // Log the OpenAI call
      if (!user) {
        throw new Error('User not authenticated');
      }

      const logEntry: OpenAILogInsert = {
        user_id: user.id,
        request_type: 'prd_generation',
        model: 'gpt-4o-mini',
        request_payload: {
          messages: response.choices[0].message.content,
          model: 'gpt-4o-mini',
          temperature: 0.7,
          max_tokens: 2000,
        } as Json,
        response_payload: response.choices[0].message.content as Json,
        input_tokens: response.usage?.prompt_tokens ?? null,
        output_tokens: response.usage?.completion_tokens ?? null,
        error: null
      };

      const { data: logData, error: logError } = await supabase
        .from('openai_logs')
        .insert([logEntry] as any)
        .select()
        .single();

      if (logError) {
        throw new Error('Failed to create OpenAI log entry');
      }

      // Generate a unique slug for the product
      const uniqueSlug = await generateUniqueSlug(productName.trim());

      // Create product
      const productEntry: ProductInsert = {
        name: productName.trim(),
        description: parsedData.product_description || '',
        user_id: user.id,
        slug: uniqueSlug
      };

      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert([productEntry] as any)
        .select()
        .single();

      if (productError || !productData) {
        throw new Error('Failed to create product');
      }

      // Create PRD
      const prdEntry: PRDInsert = {
        product_id: productData.id,
        problem: parsedData.problem || '',
        solution: parsedData.solution || '',
        target_audience: parsedData.target_audience || '',
        tech_stack: '',
        success_metrics: ''
      };

      const { data: prdData, error: prdError } = await supabase
        .from('prds')
        .insert([prdEntry] as any)
        .select()
        .single();

      if (prdError) {
        throw new Error('Failed to create PRD');
      }

      // Create features
      if (parsedData.features && Array.isArray(parsedData.features) && productData) {
        const features: FeatureInsert[] = parsedData.features.map((feature: any, index: number) => ({
          product_id: productData.id,
          name: feature.name || '',
          description: feature.description || null,
          priority: (feature.priority || 'not-prioritized') as FeatureInsert['priority'],
          implementation_status: 'not_started',
          position: index // Use the index as position to maintain original order
        }));

        if (features.length > 0) {
          const { error: featuresError } = await supabase
            .from('features')
            .insert(features as any);
          
          if (featuresError) {
            console.error('Failed to create features:', featuresError);
          }
        }
      }

      // Navigate to the PRD editor
      if (productData && 'slug' in productData) {
        navigate(`/product/${productData.slug}/prd`);
      }

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
    if (!user.data.user) {
      toast.error('You must be logged in to generate personas');
      return;
    }

    setIsLoading(true); // Set loading state immediately
    try {
      const requestPayload = {
        productName: formData.productName,
        problemStatement: formData.problemStatement,
        solution: formData.solution,
        targetAudience: formData.targetAudience
      };

      // Log the OpenAI request
      const logEntry: OpenAILogInsert = {
        user_id: user.data.user.id,
        request_type: 'generate_personas',
        model: 'gpt-4o',
        request_payload: requestPayload as Json,
        response_payload: null,
        error: null,
        input_tokens: null,
        output_tokens: null
      };

      const { data: logData, error: logError } = await supabase
        .from('openai_logs')
        .insert([logEntry] as any)
        .select()
        .single();

      if (logError) {
        throw new Error('Failed to create OpenAI log entry');
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
      
      // Update the OpenAI log with the response
      const updatedLogEntry = {
        response_payload: response.choices[0].message.content as Json,
        input_tokens: response.usage?.prompt_tokens ?? null,
        output_tokens: response.usage?.completion_tokens ?? null
      };

      if (logData && typeof logData === 'object' && 'id' in logData && logData.id) {
        await supabase
          .from('openai_logs')
          .update(updatedLogEntry as any)
          .eq('id', logData.id);
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

      // Update state with the personas
      setFormData(prev => ({
        ...prev,
        personas: result.personas,
        selectedPersonaIndex: null // Reset selection when regenerating
      }));

      toast.success('Successfully generated new personas');

    } catch (error) {
      console.error('Error generating personas:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate customer personas. Please try again.');
    } finally {
      setIsLoading(false); // Clear loading state after success or failure
    }
  };

  return (
    <div className="container py-8 space-y-16">
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
          <Card 
            className={cn(
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
          <Card 
            className={cn(
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
                <CardTitle>Generate PRD with AI</CardTitle>
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
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Upload Your PRD</CardTitle>
              </div>
              <CardDescription className="text-base text-muted-foreground mt-1.5">Enter your product name and paste your existing PRD content below.</CardDescription>
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
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Generate PRD with AI</CardTitle>
              </div>
              <CardDescription className="text-base text-muted-foreground mt-1.5">
                Fluxr will walk you through step by step to create a PRD.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="rounded-lg border bg-muted/50 p-6 space-y-6">
                <h3 className="text-base font-medium">4 Simple Steps to a Great PRD:</h3>
                <div className="space-y-5">
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-sm font-medium">1</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">Start with the fundamentals of your product idea.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-sm font-medium">2</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">Hone in on your target audience.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-sm font-medium">3</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">Identify the core problem and core solution.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-sm font-medium">4</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">Generate and prioritize features.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Takes less than 5 minutes, but you can save your progress as you go.</p>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedOption(null);
                      scrollToSection(optionsRef);
                    }}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  {!showForm && (
                    <Button onClick={handleStartGenerating} className="gap-2 shadow-sm hover:shadow-md transition-all">
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Details Form */}
          {showForm && (
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
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          Continue to Generate PRD
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
                  <div className="grid gap-6 md:grid-cols-3 w-[85%] mx-auto">
                    {formData.personas.map((persona, index) => (
                      <PersonaCard
                        key={index}
                        persona={persona}
                        isSelected={formData.selectedPersonaIndex === index}
                        onClick={() => handlePersonaSelect(index)}
                      />
                    ))}
                  </div>
                  
                  <div className="flex justify-end items-center gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      className="gap-2 mr-auto hover:bg-background"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleGeneratePersonas}
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
                          <RefreshCw className="icon-button" />
                          <span>Regenerate Personas</span>
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
                          Generating...
                        </>
                      ) : (
                        <>
                          Continue to Generate PRD
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 