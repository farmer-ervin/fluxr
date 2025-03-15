import { TextActionRequest } from '../types.ts';

export const sectionGuidance = {
  overview: `This section should provide a high-level overview of the product, including the vision statement, key objectives, market opportunity, and strategic alignment.`,
  problem: `This section should clearly articulate the problem statement, current pain points, existing solutions, and why a new solution is needed.`,
  solution: `This section should describe how the product solves the identified problems, including key differentiators, unique value proposition, and competitive advantages.`,
  target_audience: `This section should define the target users and stakeholders, including user personas, market segments, demographics, and user behaviors/needs.`,
  tech_stack: `This section should detail the technology choices, including frontend, backend, development tools, third-party services, and deployment infrastructure.`,
  success_metrics: `This section should outline the key performance indicators (KPIs), success criteria, and measurement methods for evaluating product success.`
};

export const promptTemplates = {
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

export function prepareTextActionPrompt(data: TextActionRequest): {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
  defaultModel: string;
} {
  const { text, action, context } = data;
  
  const template = promptTemplates[action];
  if (!template) {
    throw new Error(`Invalid action type: ${action}`);
  }
  
  // Calculate target word count for expand/shorten
  const wordCount = text.trim().split(/\s+/).length;
  const targetWordCount = action === 'expand' 
    ? Math.round(wordCount * 1.4)  // 40% longer
    : action === 'shorten'
    ? Math.round(wordCount * 0.6)  // 40% shorter
    : 0;
  
  // Add context to the system prompt if available
  let systemPrompt = template.systemPrompt;
  if (context) {
    systemPrompt += `\n\nContext (for understanding only, do not include in output):\n`;
    if (context.section) {
      // Add section-specific guidance
      const guidance = sectionGuidance[context.section as keyof typeof sectionGuidance];
      if (guidance) {
        systemPrompt += `Current Section: ${context.section}\nSection Purpose: ${guidance}\n`;
      } else {
        systemPrompt += `Current Section: ${context.section}\n`;
      }
    }
    if (context.productContext) {
      systemPrompt += `Product Context: ${context.productContext}\n`;
    }
    
    // Add explicit reminder about section titles
    systemPrompt += `\nREMINDER: Do not include any section titles or headers in your response. Return only the content text.\n`;
  }
  
  // Add word count requirements for expand/shorten
  if (targetWordCount > 0) {
    systemPrompt += `\n\nOriginal word count: ${wordCount}\nRequired word count: ${targetWordCount}\n`;
  }
  
  return {
    systemPrompt,
    userPrompt: text,
    temperature: template.temperature,
    maxTokens: template.maxTokens,
    defaultModel: 'gpt-4o-mini'  // Match your existing implementation
  };
} 