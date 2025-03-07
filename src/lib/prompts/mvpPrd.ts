import { openai, OpenAIError } from '../openai';
import { supabase } from '../supabase';
import { ChatCompletionMessageParam } from 'openai/resources/chat';
import { Database } from '../database.types';
import { Json } from '../types';

interface GenerateMvpPrdParams {
  customerProfile: any;
  productDescription: string;
  problems: {
    biggestFrustration: string;
    manualTasks: string[];
    painPoints: string;
    inefficiencies: string[];
  };
}

// Define the OpenAI log entry type to match Supabase schema
type OpenAILogEntry = Database['public']['Tables']['openai_logs']['Insert'];

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

    const logEntry: OpenAILogEntry = {
      user_id: user.id,
      request_type: requestType,
      model,
      request_payload: requestPayload,
      response_payload: responsePayload || null,
      error: error?.message || error?.toString() || null,
      input_tokens: input_tokens || null,
      output_tokens: output_tokens || null
    };

    await supabase.from('openai_logs').insert([logEntry]);
  } catch (err) {
    // Silent failure for logging errors
  }
}

export async function generateMvpPrd({ 
  customerProfile,
  productDescription,
  problems 
}: GenerateMvpPrdParams) {
  const requestPayload = {
    customerProfile,
    productDescription,
    problems
  };

  const systemPrompt = `You are an elite product strategist and PRD expert specializing in creating focused, impactful products. Your task is to analyze the product opportunity and define the product, and prioritize features for the MVP that delivers the maximum value with minimal complexity. MVP features are must haves, while other features are prioritized as nice to have or not prioritized.`;

  const userPrompt = `Help me define the PRD and optimal MVP version of this product that solves the main problem for this customer persona.

Product Description: ${productDescription}

Target Persona Details:
<h3><strong>Target Persona</strong></h3>

Overview:
${customerProfile.overview.paragraph1}
${customerProfile.overview.paragraph2}
${customerProfile.overview.paragraph3}

<h3><strong>Background</strong></h3>
<ul>
  <li><strong>Role:</strong> ${customerProfile.background.role}</li>
  <li><strong>Industry:</strong> ${customerProfile.background.industry}</li>
  <li><strong>Company Size:</strong> ${customerProfile.background.companySize}</li>
  <li><strong>Company Type:</strong> ${customerProfile.background.companyType}</li>
</ul>

<h3><strong>Daily Responsibilities</strong></h3>
<ul>
${customerProfile.background.dailyResponsibilities.map((resp: string) => `<li>${resp}</li>`).join('\n')}
</ul>

<h3><strong>Current Tools</strong></h3>
<ul>
${customerProfile.background.currentTools.map((tool: string) => `<li>${tool}</li>`).join('\n')}
</ul>

<h3><strong>Problems & Pain Points</strong></h3>
<ul>
  <li><strong>Biggest Frustration:</strong> ${customerProfile.problems.biggestFrustration}</li>
  <li><strong>Pain Points:</strong> ${customerProfile.problems.painPoints}</li>
</ul>

<h3><strong>Manual Tasks</strong></h3>
<ul>
${customerProfile.problems.manualTasks.map((task: string) => `<li>${task}</li>`).join('\n')}
</ul>

<h3><strong>Inefficiencies</strong></h3>
<ul>
${customerProfile.problems.inefficiencies.map((inefficiency: string) => `<li>${inefficiency}</li>`).join('\n')}
</ul>

Your analysis should be thorough and detailed, and should include the following:

1. Problem
   - Core pain point
   - Market and competitor gaps including how the target audience is solving this today and the areas competitors are failing to address
   - Solution urgency and market readiness

2. Solution Strategy  
   - One line value proposition
   - Detailed solution including key capabilities and how it addresses the problem and the market gap
   - Key differentiators from current solutions and competitors
   - Critical assumptions

3. Features needed for a v1 product with MVP features being must haves. Features should be prioritized based on the value they add to the customer and the effort to implement. Features should include a name, description, priority (must-have, nice-to-have, or not-prioritized), and implementation status of not-started. Include must have items like user authentication and database setup and every other item needed to build the product. For features that require API integrations, include that in the feature description.
    - MVP features are must haves. Limit this to the bare minimum core value.
    - Nice to have features are features that are P2 and would be critical to compete in the market.
    - Not prioritized features are features that are P3 and beyond.
  Output at least 15 features.

Always return your response as a JSON object with the following structure:
{
  "prd": {
    "problem": "<p>[One-line problem statement]</p><h3><strong>Details</strong></h3><p>[Comprehensive problem analysis]</p><h3><strong>Market Gap</strong></h3><p>[Specific gaps in the market including competitive gaps and how users are solving this today.]</p><h3><strong>Why Now?</strong></h3><p>[Why this needs solving now]</p><h3><strong>Problem Impact</strong></h3><p>[Quantified problem impact on users]</p>",
    
    "solution": "<p>[One-line solution value proposition]</p><h3><strong>Details</strong></h3><p>[Comprehensive solution description including value prop, key capabilities, and how it addresses the problem and the market gap]</p><h3><strong>Key Differentiators</strong></h3><ul><li>[2 sentences explaining #1 key differentiator]</li><li>[2 sentences explaining #2 key differentiator]</li></ul><h3><strong>MVP Constraints & Limitations</strong></h3><ul><li>[Limitation of MVP 1]</li><li>[Limitation of MVP 2]</li></ul><h3><strong>Critical Assumptions</strong></h3><ul><li>[Assumption 1]</li><li>[Assumption 2]</li></ul>",
    
    "features": [
      {
        "name": "Feature name",
        "description": "Multiple sentence feature description including key functionality anddetails needed to implement the feature.",
        "priority": "[must-have | nice-to-have | not-prioritized]",
        "implementation_status": "not_started"
      }
    ]
  }
}`;

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: systemPrompt
    },
    {
      role: "user", 
      content: userPrompt
    }
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.6,
      max_tokens: 8000,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0].message.content;
    const tokenUsage = completion.usage;

    await logOpenAICall({
      model: "gpt-4o",
      requestType: 'generate_mvp_prd',
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
      requestType: 'generate_mvp_prd',
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