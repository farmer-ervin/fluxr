import { OpenAIError, callOpenAI } from './openai';
import { supabase } from './supabase';

interface AiTextRequest {
  text: string;
  action: 'improve' | 'expand' | 'shorten';
  context?: {
    section?: string;
    productContext?: string;
  };
}

interface AiTextResponse {
  content: string;
}

const sectionGuidance = {
  overview: `This section should provide a high-level overview of the product, including the vision statement, key objectives, market opportunity, and strategic alignment.`,
  problem: `This section should clearly articulate the problem statement, current pain points, existing solutions, and why a new solution is needed.`,
  solution: `This section should describe how the product solves the identified problems, including key differentiators, unique value proposition, and competitive advantages.`,
  target_audience: `This section should define the target users and stakeholders, including user personas, market segments, demographics, and user behaviors/needs.`,
  tech_stack: `This section should detail the technology choices, including frontend, backend, development tools, third-party services, and deployment infrastructure.`,
  success_metrics: `This section should outline the key performance indicators (KPIs), success criteria, and measurement methods for evaluating product success.`
};

const promptTemplates = {
  improve: {
    systemPrompt: `You are an expert editor focused on improving writing clarity, professionalism, and impact. 
    You are specifically editing a section of a Product Requirements Document (PRD).
    
    Your task is to enhance the given text while:
    - Maintaining the original meaning and key points
    - Improving clarity and readability
    - Using more professional and precise language
    - Fixing any grammatical or structural issues
    - Enhancing the overall flow
    - Ensuring the content aligns with PRD best practices
    - Using industry-standard terminology
    - Maintaining consistency with product management documentation standards
    
    IMPORTANT: Do not include section titles or headers in your response.
    Return only the improved content text without any section headings.
    
    Return only the improved text without any explanations or additional content.`,
    temperature: 0.7,
    maxTokens: 1000
  },
  expand: {
    systemPrompt: `You are an expert content developer specializing in expanding and enriching text. 
    You are specifically expanding a section of a Product Requirements Document (PRD).
    
    Your task is to elaborate on the given text by:
    - Adding relevant details and examples
    - Expanding on key concepts
    - Including supporting information
    - Maintaining a professional tone
    - Ensuring logical flow and structure
    - Adding relevant product management context
    - Including industry-standard metrics and benchmarks where applicable
    - Providing concrete examples and use cases
    
    Return only the expanded text without any explanations or additional content.`,
    temperature: 0.7,
    maxTokens: 1500
  },
  shorten: {
    systemPrompt: `You are an expert editor specializing in concise writing.
    You are specifically condensing a section of a Product Requirements Document (PRD).
    
    Your task is to make the text more concise while:
    - Preserving all key information
    - Maintaining clarity and professionalism
    - Removing redundancy
    - Using precise language
    - Keeping the core message intact
    - Retaining critical product requirements
    - Preserving essential metrics and specifications
    - Maintaining traceability to business objectives
    
    Return only the shortened text without any explanations or additional content.`,
    temperature: 0.3,
    maxTokens: 500
  }
};

export async function processAiText({ text, action, context }: AiTextRequest): Promise<AiTextResponse> {
  try {
    const response = await callOpenAI(text, action, context);
    return { content: response.content || '' };
  } catch (error) {
    if (error instanceof OpenAIError) {
      throw error;
    } else {
      throw new OpenAIError('Failed to process text. Please try again.');
    }
  }
}