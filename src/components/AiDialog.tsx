import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "./ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { 
  Sparkles, 
  ArrowLeft, 
  AlertTriangle, 
  ClipboardList, 
  Users, 
  Bot, 
  PencilLine,
  CheckCircle2
} from "lucide-react"
import { Label } from "@radix-ui/react-label"
import { Textarea } from "./ui/textarea"
import { generatePrdContent, OpenAIError } from "@/lib/openai"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { ProductDescription } from '@/components/ProductDescription'

interface Step {
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    title: "AI-Powered PRD Generation",
    description: "Let AI help you research and write your PRD. We'll analyze your product details and generate comprehensive content for each section."
  },
  {
    title: "Product Details",
    description: "Let's gather some information about your product and target audience to generate the most relevant content."
  }
]

export function AiDialog() {
  const navigate = useNavigate();
  const { productSlug } = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    productDescription: "",
    targetAudience: ""
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProductDescription() {
      if (!productSlug) return;
      
      try {
        const { data, error } = await supabase
          .from('products')
          .select('description')
          .eq('slug', productSlug)
          .single();

        if (error) throw error;
        if (data) {
          setFormData(prev => ({
            ...prev,
            productDescription: data.description || ''
          }));
        }
      } catch (error) {
        console.error('Error loading product description:', error);
      }
    }

    loadProductDescription();
  }, [productSlug]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleNext = () => {
    setCurrentStep(1);
  };

  const handleBack = () => {
    setCurrentStep(0);
    // Clear any errors when going back
    if (error) setError(null);
  };

  const handleGenerate = async () => {
    if (!productSlug) {
      setError('Product slug is missing');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const content = await generatePrdContent({
        productDescription: formData.productDescription,
        targetAudience: formData.targetAudience
      });
      
      // Parse the JSON response
      const profiles = JSON.parse(content);
      
      // Navigate to the customer profiles page with the data
      navigate(`/product/${productSlug}/customer-profiles`, { state: { profiles } });
    } catch (error) {
      // Handle user-friendly error message
      if (error instanceof OpenAIError) {
        setError(error.message);
      } else {
        setError('Something went wrong. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Research & Write PRD with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <div className="bg-brand-purple/10 p-6">
          <DialogHeader className="mb-0">
            {currentStep === 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-4 top-4 p-0 w-8 h-8 text-brand-purple hover:bg-brand-purple/10"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="text-xl text-brand-purple">{steps[currentStep].title}</DialogTitle>
            <DialogDescription className="text-gray-700">
              {steps[currentStep].description}
            </DialogDescription>
          </DialogHeader>

          {/* Progress indicator */}
          <div className="flex items-center justify-center mt-4 space-x-1">
            <div className={cn(
              "h-2 w-8 rounded-full transition-colors",
              currentStep === 0 ? "bg-brand-purple" : "bg-gray-300"
            )} />
            <div className={cn(
              "h-2 w-8 rounded-full transition-colors",
              currentStep === 1 ? "bg-brand-purple" : "bg-gray-300"
            )} />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 mx-6 mt-4 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {currentStep === 0 ? (
          <div className="px-6 py-6">
            <div className="mb-6 bg-gradient-to-r from-brand-purple/5 to-brand-purple/10 p-4 rounded-lg border border-brand-purple/20">
              <h3 className="font-medium text-brand-purple mb-2 flex items-center">
                <Sparkles className="w-4 h-4 mr-2" />
                Let AI do the heavy lifting
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                Our AI assistant will help you create a professional PRD by analyzing your inputs and generating high-quality content.
              </p>
            </div>
            
            <h3 className="font-medium text-gray-800 mb-3">How the process works:</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg transition-colors hover:bg-gray-100">
                <div className="w-8 h-8 bg-brand-purple/20 rounded-full flex items-center justify-center flex-shrink-0 text-brand-purple">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Enter your product details</p>
                  <p className="text-sm text-gray-600">Be as detailed as possible about your product's purpose and features</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg transition-colors hover:bg-gray-100">
                <div className="w-8 h-8 bg-brand-purple/20 rounded-full flex items-center justify-center flex-shrink-0 text-brand-purple">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Select your customer persona</p>
                  <p className="text-sm text-gray-600">Fluxr will analyze your market and suggest who to target</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg transition-colors hover:bg-gray-100">
                <div className="w-8 h-8 bg-brand-purple/20 rounded-full flex items-center justify-center flex-shrink-0 text-brand-purple">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Generate your PRD</p>
                  <p className="text-sm text-gray-600">Our AI will create a comprehensive PRD based on your inputs</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg transition-colors hover:bg-gray-100">
                <div className="w-8 h-8 bg-brand-purple/20 rounded-full flex items-center justify-center flex-shrink-0 text-brand-purple">
                  <PencilLine className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Review and customize</p>
                  <p className="text-sm text-gray-600">Approve, edit, and refine the generated content</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-6 py-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productDescription" className="text-gray-700 font-medium flex items-center">
                  <ClipboardList className="w-4 h-4 mr-2 text-brand-purple" />
                  Product Description
                </Label>
                <Textarea
                  id="productDescription"
                  name="productDescription"
                  value={formData.productDescription}
                  onChange={handleInputChange}
                  placeholder="Describe your product in detail..."
                  className="min-h-[120px] border-gray-300 focus:border-brand-purple focus:ring-brand-purple"
                />
                <p className="text-xs text-gray-500 italic">Provide as much detail as possible about what your product does and its key features</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="targetAudience" className="text-gray-700 font-medium flex items-center">
                  <Users className="w-4 h-4 mr-2 text-brand-purple" />
                  Target Audience
                </Label>
                <Textarea
                  id="targetAudience"
                  name="targetAudience"
                  value={formData.targetAudience}
                  onChange={handleInputChange}
                  placeholder="Tell us everything you know about your target audience..."
                  className="min-h-[120px] border-gray-300 focus:border-brand-purple focus:ring-brand-purple"
                />
                <p className="text-xs text-gray-500 italic">Describe who will use your product, their pain points, and what they're looking for</p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="p-4 bg-gray-50 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={currentStep === 0 ? handleNext : handleGenerate}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                Generating...
              </span>
            ) : currentStep === 0 ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Start AI Generation
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Bot className="w-4 h-4" />
                Generate PRD Content
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}