import { openai, OpenAIError } from '../openai';
import { supabase } from '../supabase';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { Database } from '../database.types';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';

interface GeneratePrdContentParams {
  productDescription: string;
  targetAudience: string;
}

type OpenAILogInsert = Database['public']['Tables']['openai_logs']['Insert'];

async function logOpenAICall({
  model,
  requestType,
  requestPayload,
  responsePayload,
  error,
  input_tokens,
  output_tokens
}: {
  model: string;
  requestType: string;
  requestPayload: any;
  responsePayload?: any;
  error?: any;
  input_tokens?: number;
  output_tokens?: number;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const logEntry: OpenAILogInsert = {
      user_id: user.id,
      request_type: requestType,
      model,
      request_payload: requestPayload,
      response_payload: responsePayload,
      error: error?.message || error?.toString(),
      input_tokens,
      output_tokens
    };

    const { error: insertError } = await supabase
      .from('openai_logs')
      .insert(logEntry)
      .select();

    if (insertError) {
      console.error('Failed to log OpenAI call:', insertError);
    }
  } catch (err) {
    // Silent failure for logging errors
  }
}

export async function generatePrdContent({ 
  productDescription, 
  targetAudience
}: GeneratePrdContentParams) {
  const requestPayload = {
    productDescription,
    targetAudience
  };

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are an expert product strategist specializing in customer persona development and market analysis. Your task is to analyze a product opportunity and create detailed customer profiles that will inform the MVP development.

For the given product and target audience, create 3 distinct customer profiles that represent different segments of the target market. Each profile should be highly detailed and actionable.

Your response must be a valid JSON object with this exact structure:
{
  "customerProfiles": [
    {
      "name": "Clear persona name with role (e.g., 'Sarah Chen - Senior Product Manager')",
      "overview": {
        "paragraph1": "Professional background and current role context",
        "paragraph2": "Daily challenges and primary needs",
        "paragraph3": "Career goals and aspirations"
      },
      "background": {
        "role": "Current job title or role",
        "industry": "Industry or market sector",
        "companySize": "Company size (for B2B) or household type (for B2C)",
        "companyType": "Type of organization or lifestyle category",
        "dailyResponsibilities": ["List of key daily tasks and responsibilities"],
        "currentTools": ["List of current solutions and tools being used"]
      },
      "problems": {
        "biggestFrustration": "Single biggest pain point or challenge",
        "manualTasks": ["List of time-consuming manual tasks"],
        "painPoints": "Detailed description of current workflow problems",
        "inefficiencies": ["List of specific inefficiencies in current process"]
      },
      "scoring": {
        "problemMatch": "Score 1-5",
        "urgencyToSolve": "Score 1-5",
        "abilityToPay": "Score 1-5",
        "explanation": "Detailed explanation of why this persona is a good fit"
      }
    }
  ],
  "recommendation": {
    "selectedProfile": "Name of recommended profile to target first",
    "rationale": "Detailed explanation of why this profile should be targeted first including the average score and why it's a better recommendation than the other profiles."
  }
}`
    },
    {
      role: "user", 
      content: `Create 3 detailed customer profiles for this product:

Product Description: ${productDescription}
Target Audience: ${targetAudience}`
    }
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0].message.content;
    const tokenUsage = completion.usage;

    await logOpenAICall({
      model: "gpt-4o",
      requestType: 'generate_prd_content',
      requestPayload,
      responsePayload: response,
      input_tokens: tokenUsage?.prompt_tokens,
      output_tokens: tokenUsage?.completion_tokens
    });
    return response;
  } catch (error) {
    // Silent console error, but still log to database
    await logOpenAICall({
      model: "gpt-4o",
      requestType: 'generate_prd_content',
      requestPayload,
      error
    });
    
    // Throw user-friendly error
    throw new OpenAIError(getUserFriendlyErrorMessage(error), error);
  }
}

function getUserFriendlyErrorMessage(error: any): string {
  // Check for common error types
  if (error.status === 429) {
    return "We're experiencing high demand right now. Please try again in a moment.";
  } else if (error.status === 401 || error.status === 403) {
    return "Authentication error occurred. Please try again later.";
  } else if (error.status >= 500) {
    return "Our AI service is temporarily unavailable. Please try again later.";
  } else if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
    return "Request timed out. Please try again or use a simpler prompt.";
  } else if (error.message?.includes('network') || !navigator.onLine) {
    return "Please check your internet connection and try again.";
  }
  
  // Default generic message
  return "Something went wrong with AI generation. Please try again.";
}