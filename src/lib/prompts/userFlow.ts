import { openai, OpenAIError } from '../openai';
import { supabase } from '../supabase';
import { Feature } from '../database.types';

interface GenerateFlowParams {
  productDescription: string;
  problemStatement: string;
  solutionDescription: string;
  features: Feature[];
  flowPattern?: string;
  additionalRequirements?: string;
}

export interface FlowPage {
  name: string;
  description: string;
  layout_description?: string;
  features?: string[];
}

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

    await supabase.from('openai_logs').insert({
      user_id: user.id,
      request_type: requestType,
      model,
      request_payload: requestPayload,
      response_payload: responsePayload,
      error: error?.message || error?.toString(),
      input_tokens,
      output_tokens
    });
  } catch (err) {
    // Silent failure for logging errors
  }
}

export async function generateUserFlow({
  productDescription,
  problemStatement,
  solutionDescription,
  features,
  flowPattern = 'auto',
  additionalRequirements
}: GenerateFlowParams) {
  const featuresFormatted = features.map(f => ({
    name: f.name,
    description: f.description,
    priority: f.priority,
    status: f.implementation_status
  }));

  const requestPayload = {
    productDescription,
    problemStatement,
    solutionDescription,
    features: featuresFormatted,
    flowPattern,
    additionalRequirements
  };

  const messages = [
    {
      role: "system",
      content: `You are an expert product manager and UX designer. Your task is to generate a comprehensive user flow based on the provided product requirements.

Your response must be a valid JSON object with the following structure:
{
  "pages": [
    {
      "name": "Page name",
      "description": "Detailed description of the page's purpose and content",
      "layout_description": "Design terminology description of the page layout",
      "features": ["Feature Name 1", "Feature Name 2"]
    }
  ]
}`
    },
    {
      role: "user",
      content: `Create a comprehensive user flow with detailed page information for this product:

Product Description: ${productDescription}

Problem Statement: ${problemStatement}

Solution Description: ${solutionDescription}

Features:
${featuresFormatted.map(f => `- ${f.name}: ${f.description}
  Priority: ${f.priority}
  Status: ${f.status}`).join('\n')}

${additionalRequirements ? `\nAdditional Requirements:\n${additionalRequirements}` : ''}`
    }
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0].message.content;
    const tokenUsage = completion.usage;

    await logOpenAICall({
      model: "gpt-4o-mini",
      requestType: 'generate_user_flow',
      requestPayload,
      responsePayload: response,
      input_tokens: tokenUsage?.prompt_tokens,
      output_tokens: tokenUsage?.completion_tokens
    });

    return JSON.parse(response);
  } catch (error) {
    // Silent console error, but still log to database
    await logOpenAICall({
      model: "gpt-4o-mini",
      requestType: 'generate_user_flow',
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