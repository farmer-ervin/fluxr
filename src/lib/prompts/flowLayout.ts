import { openai, OpenAIError } from '../openai';
import { supabase } from '../supabase';
import { FlowPage } from './userFlow';

interface FlowLayout {
  pages: {
    id: string;
    name: string;
    position: { x: number; y: number };
  }[];
  connections: {
    source: string;
    target: string;
  }[];
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

export async function generateFlowLayout(pages: FlowPage[], flowPattern: string = 'auto'): Promise<FlowLayout> {
  const messages = [
    {
      role: "system",
      content: `You are an expert in creating visually appealing flow diagrams. Your task is to arrange pages in a logical layout that shows their relationships clearly.

The layout MUST follow these rules:
1. Primary flow should be horizontal from left to right
2. Start the leftmost page at x=0, y=0
3. Space pages horizontally with 250px gaps between them
4. Entry/landing pages should be leftmost
5. Final/completion pages should be rightmost
6. Related pages should be adjacent
7. Pages can have multiple connections to other pages
8. When a page connects to multiple pages, arrange the target pages vertically (stacked)
9. For vertical stacking, use 150px gaps between pages

You should apply the specified flow pattern: "${flowPattern}". The available patterns are:
- "linear": Pages are arranged in a straight line from left to right
- "hub-and-spoke": One central hub page with other pages radiating outward
- "nested": Pages are arranged in a hierarchical structure with parent-child relationships
- "auto": Automatically determine the best pattern based on the page relationships

Your response must be a valid JSON object with the following structure:
{
  "pages": [
    {
      "id": "page-name-as-id",
      "name": "Page Name",
      "position": { "x": number, "y": number }
    }
  ],
  "connections": [
    {
      "source": "source-page-id",
      "target": "target-page-id"
    }
  ]
}

Guidelines:
1. Arrange pages primarily horizontally from left to right
2. Start from (0,0) and expand rightward
3. When a page connects to multiple pages, arrange them vertically
4. For example, if Page 1 connects to Page 2 and Page 3, place Page 2 above Page 3 at the same x-coordinate
5. Create logical flows (e.g., landing → signup → dashboard → features)
6. For vertical arrangements, place the most important or frequently used page at the top
7. If multiple pages connect to the same page, make sure the connections don't overlap too much`
    },
    {
      role: "user",
      content: `Generate a ${flowPattern} layout for these pages, arranged from left to right, with vertical stacking for pages with multiple connections:

${pages.map(p => `${p.name}: ${p.description}`).join('\n\n')}`
    }
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.4,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0].message.content;
    const tokenUsage = completion.usage;

    await logOpenAICall({
      model: "gpt-4o",
      requestType: 'generate_flow_layout',
      requestPayload: { pages, flowPattern },
      responsePayload: response,
      input_tokens: tokenUsage?.prompt_tokens,
      output_tokens: tokenUsage?.completion_tokens
    });

    return JSON.parse(response) as FlowLayout;
  } catch (error) {
    // Silent console error, but still log to database
    await logOpenAICall({
      model: "gpt-4o",
      requestType: 'generate_flow_layout',
      requestPayload: { pages, flowPattern },
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