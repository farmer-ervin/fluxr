import { openai, OpenAIError } from '../openai';
import { supabase } from '../supabase';

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

  const messages = [
    {
      role: "system",
      content: `You are an elite product strategist and MVP expert specializing in creating focused, impactful minimum viable products. Your task is to analyze the product opportunity and define the optimal MVP that delivers maximum value with minimal complexity.

Your analysis should cover:

1. Problem Analysis
   - Core pain point identification and impact assessment
   - Current workarounds and their limitations
   - Solution urgency and market readiness
   - Competitive landscape and market gaps
   - User behavior patterns and friction points

2. Solution Strategy  
   - Core value proposition
   - Key differentiators
   - Technical feasibility assessment
   - Implementation complexity analysis
   - Resource requirements
   - Time to market estimation

3. Success Criteria
   - Key performance indicators
   - User adoption metrics
   - Business impact measures
   - Technical performance metrics
   - Learning objectives

4. Risk Assessment
   - Technical limitations
   - User adoption barriers
   - Market risks
   - Resource constraints
   - Scaling challenges

5. Growth Strategy
   - Feature expansion roadmap
   - Market expansion opportunities
   - Revenue model evolution
   - Partnership potential
   - Platform scalability

Always return your response as a JSON object with the following structure:
{
  "prd": {
    "problem": "<p>[One-line problem statement]</p><h3><strong>Details</strong></h3><p>[Comprehensive problem analysis including market context, user impact, and current solutions]</p><h3><strong>Market Gap</strong></h3><p>[Specific gap in the market this addresses]</p><h3><strong>Why Now?</strong></h3><p>[Why this needs solving now]</p><h3><strong>Problem Impact</strong></h3><p>[Quantified problem impact on users]</p>",
    
    "solution": "<p>[One-line solution value proposition]</p><h3><strong>Solution Details</strong></h3><p>[Comprehensive solution description including approach, architecture, and key capabilities]</p><h3><strong>Key Differentiators</strong></h3><ul><li>[Competitive advantage 1]</li><li>[Competitive advantage 2]</li></ul><h3><strong>Constraints & Limitations</strong></h3><ul><li>[Limitation 1]</li><li>[Limitation 2]</li></ul><h3><strong>Critical Assumptions</strong></h3><ul><li>[Assumption 1]</li><li>[Assumption 2]</li></ul>",
    
    "targetAudience": "<h2><strong>Primary User Persona</strong></h2><p>[Detailed primary user persona]</p><h3><strong>Secondary Users</strong></h3><p>[Secondary user personas]</p><h3><strong>Key Demographics</strong></h3><ul><li>[Demographic factor 1]</li><li>[Demographic factor 2]</li></ul><h3><strong>Psychographic Profile</strong></h3><ul><li>[Psychographic detail 1]</li><li>[Psychographic detail 2]</li></ul><h3><strong>User Behaviors</strong></h3><ul><li>[Behavior pattern 1]</li><li>[Behavior pattern 2]</li></ul><h3><strong>Critical User Needs</strong></h3><ul><li>[Need 1]</li><li>[Need 2]</li></ul>",
    
    "features": [
      {
        "name": "Feature name",
        "description": "Detailed feature description",
        "priority": "must-have",
        "implementation_status": "not_started"
      }
    ],
    
    "tech_stack": "<h2>Technology Stack</h2><h3>Frontend Technologies</h3><ul><li>[Frontend tech 1]</li><li>[Frontend tech 2]</li></ul><h3>Backend Technologies</h3><ul><li>[Backend tech 1]</li><li>[Backend tech 2]</li></ul><h3>Infrastructure</h3><ul><li>[Infrastructure need 1]</li><li>[Infrastructure need 2]</li></ul><h3>Third-Party Integrations</h3><ul><li>[Integration 1]</li><li>[Integration 2]</li></ul><h3>Security Requirements</h3><p>[Security requirements and considerations]</p><h3>Scalability Considerations</h3><p>[Scalability requirements and approach]</p>",
    
    "success_metrics": "<h2>Success Metrics & KPIs</h2><h3>User Success Metrics</h3><ul><li>[User metric 1]</li><li>[User metric 2]</li></ul><h3>Business Success Metrics</h3><ul><li>[Business metric 1]</li><li>[Business metric 2]</li></ul><h3>Technical Performance Metrics</h3><ul><li>[Performance metric 1]</li><li>[Performance metric 2]</li></ul><h3>Key Learning Objectives</h3><ul><li>[Learning goal 1]</li><li>[Learning goal 2]</li></ul><h3>Success Validation</h3><p>[How to validate success]</p><h3>Timeline & Milestones</h3><p>[Expected time to validation with key milestones]</p>"
  }
}`
    },
    {
      role: "user", 
      content: `Help me define the optimal MVP version of this product that solves the main problem for this customer persona.

Product Description: ${productDescription}

Main Problem: ${problems.biggestFrustration}
Additional Problems:
- Pain Points: ${problems.painPoints}
- Manual Tasks: ${problems.manualTasks.join(', ')}
- Inefficiencies: ${problems.inefficiencies.join(', ')}

Customer Persona: ${JSON.stringify(customerProfile, null, 2)}`
    }
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.7,
      max_tokens: 4000,
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