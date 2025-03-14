import { openai, OpenAIError } from '../openai';
import { supabase } from '../supabase';
import { Database } from '../database.types';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

type Feature = Database['public']['Tables']['features']['Row'];
type OpenAILogInsert = Database['public']['Tables']['openai_logs']['Insert'];

interface GenerateFlowParams {
  productDescription: string;
  problemStatement: string;
  solutionDescription: string;
  targetAudience: string;
  features: Feature[];
}

interface RefineFlowParams extends GenerateFlowParams {
  selectedPages: FlowPage[];
  additionalRequirements: string;
}

export interface FlowPage {
  name: string;
  description: string;
  layout_description?: string;
  features?: string[];
}

export interface RefinementResponse {
  pages: FlowPage[];
  changes: {
    added_pages: string[];
    modified_pages: {
      page_name: string;
      modifications: string[];
    }[];
  };
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

    const logEntry: OpenAILogInsert = {
      user_id: user.id,
      request_type: requestType,
      model,
      request_payload: requestPayload,
      response_payload: responsePayload,
      error: error?.message || error?.toString() || null,
      input_tokens: input_tokens || null,
      output_tokens: output_tokens || null
    };

    // @ts-ignore - Type mismatch with Supabase client, but this works in practice
    await supabase.from('openai_logs').insert(logEntry);
  } catch (err) {
    // Silent failure for logging errors
  }
}

export async function generateUserFlow({
  productDescription,
  problemStatement,
  solutionDescription,
  targetAudience,
  features
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
    targetAudience,
    features: featuresFormatted
  };

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are an expert product manager and UX designer. Your task is to generate a comprehensive user flow based on the provided product requirements. Provide the most logical user flow for the product, while keeping it an intuitive and easy to use product. If a feature can be included on a page, include it on a page instead of creating a separate page. Only include features that are part of the product already. Do not add features.

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

Product Description:
${productDescription}

Problem Statement:
${problemStatement}

Solution Description:
${solutionDescription}

Target Audience:
${targetAudience}

Features:
${featuresFormatted.map(f => `- ${f.name}: ${f.description}
  Status: ${f.status}`).join('\n')}`
    }
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0].message.content;
    const tokenUsage = completion.usage;

    await logOpenAICall({
      model: "gpt-4o",
      requestType: 'generate_user_flow',
      requestPayload,
      responsePayload: response,
      input_tokens: tokenUsage?.prompt_tokens,
      output_tokens: tokenUsage?.completion_tokens
    });

    if (!response) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(response);
  } catch (error) {
    // Silent console error, but still log to database
    await logOpenAICall({
      model: "gpt-4o",
      requestType: 'generate_user_flow',
      requestPayload,
      error
    });
    
    // Throw user-friendly error
    throw new OpenAIError(getUserFriendlyErrorMessage(error), error);
  }
}

export async function refineUserFlow({
  productDescription,
  problemStatement,
  solutionDescription,
  targetAudience,
  features,
  selectedPages,
  additionalRequirements
}: RefineFlowParams): Promise<RefinementResponse> {
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
    targetAudience,
    features: featuresFormatted,
    selectedPages,
    additionalRequirements
  };

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are an expert product manager and UX designer. Your task is to refine an existing user flow based on additional requirements. You should ONLY modify the flow to address the specific requirements provided. Do not make any other changes.

IMPORTANT RULES:
1. Do not add new pages unless necessary to meet the additional requirements
2. Maintain the same structure and format for all pages unless necessary to meet the additional requirements
3. Document all changes made in the changes section of the response

Your response must be a valid JSON object with the following structure:
{
  "pages": [
    {
      "name": "Page name",
      "description": "Detailed description of the page's purpose and content",
      "layout_description": "Design terminology description of the page layout",
      "features": ["Feature Name 1", "Feature Name 2"]
    }
  ],
  "changes": {
    "added_pages": ["Page Name 1", "Page Name 2"],
    "modified_pages": [
      {
        "page_name": "Page Name",
        "modifications": [
          "Changed description to better reflect X",
          "Added feature Y to page",
          "Modified layout to include Z"
        ]
      }
    ]
  }
}`
    },
    {
      role: "user",
      content: `Refine the following user flow based on additional requirements:

Product Context:
Product Description: ${productDescription}
Problem Statement: ${problemStatement}
Solution Description: ${solutionDescription}
Target Audience: ${targetAudience}

Features:
${featuresFormatted.map(f => `- ${f.name}: ${f.description}
  Status: ${f.status}`).join('\n')}

Current Selected Pages:
${JSON.stringify(selectedPages, null, 2)}

Additional Requirements to Address:
${additionalRequirements}

Remember:
- Only make changes necessary to meet the additional requirements
- Preserve existing structure where possible
- Document all changes made`
    }
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0].message.content;
    const tokenUsage = completion.usage;

    await logOpenAICall({
      model: "gpt-4o",
      requestType: 'refine_user_flow',
      requestPayload,
      responsePayload: response,
      input_tokens: tokenUsage?.prompt_tokens,
      output_tokens: tokenUsage?.completion_tokens
    });

    if (!response) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(response);
  } catch (error) {
    // Silent console error, but still log to database
    await logOpenAICall({
      model: "gpt-4o",
      requestType: 'refine_user_flow',
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