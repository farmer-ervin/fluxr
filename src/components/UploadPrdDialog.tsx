import React, { useState } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { 
  Upload, 
  Loader2, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import { Textarea } from './ui/textarea';
import { openai, OpenAIError } from '@/lib/openai';
import { supabase } from '@/lib/supabase';
import { normalizeFeature } from '@/lib/utils/featureNormalizer';

interface UploadPrdDialogProps {
  productId: string;
  onPrdParsed: (parsedData: ParsedPrdData) => void;
}

export interface ParsedPrdData {
  problem?: string;
  solution?: string;
  target_audience?: string;
  features?: any[];
  tech_stack?: string;
  success_metrics?: string;
  custom_sections?: Record<string, string>;
  [key: string]: any;
}

export function UploadPrdDialog({ productId, onPrdParsed }: UploadPrdDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prdContent, setPrdContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!prdContent.trim()) {
      setError('Please paste your PRD content first');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Log the OpenAI call
      const logEntry = {
        user_id: (await supabase.auth.getUser()).data.user?.id,
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
            1. Problem
            2. Solution
            3. Target Audience
            4. Features (with name, description, priority, and implementation_status)
            5. Technology Stack
            6. Success Metrics & KPIs
            
            Additionally, identify any other sections in the PRD that don't fit into these standard categories and extract them as custom sections.
            
            Return the parsed content as a JSON object with the following structure:
            {
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
              "tech_stack": "...",
              "success_metrics": "...",
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
            3. Remove special characters
            
            If a section is not found, return an empty string or empty array for features.`
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
      await supabase.from('openai_logs').insert({
        ...logEntry,
        response_payload: response.choices[0].message.content,
        input_tokens: response.usage?.prompt_tokens,
        output_tokens: response.usage?.completion_tokens
      });

      // Parse and normalize the response
      const parsedData = JSON.parse(response.choices[0].message.content || '{}');
      
      // Normalize features if they exist
      if (parsedData.features && Array.isArray(parsedData.features)) {
        parsedData.features = parsedData.features.map(normalizeFeature);
      }
      
      // Close the dialog and pass the parsed data to the parent component
      setIsOpen(false);
      onPrdParsed(parsedData);
      
    } catch (error) {
      console.error('Error parsing PRD:', error);
      
      if (error instanceof OpenAIError) {
        setError(error.message);
      } else {
        setError('Failed to parse PRD. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload PRD
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload PRD</DialogTitle>
          <DialogDescription>
            Paste your PRD content below. We'll automatically parse it into the appropriate sections.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <Textarea
            value={prdContent}
            onChange={(e) => setPrdContent(e.target.value)}
            placeholder="Paste your PRD content here..."
            className="min-h-[300px]"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isLoading || !prdContent.trim()}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Parsing...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Parse PRD
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}