import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { OpenAI } from 'https://deno.land/x/openai@v4.24.0/mod.ts';
import { verifyAuth, logOpenAICall } from '../_shared/auth.ts';
import { OpenAIRequest, OpenAIResponse } from '../_shared/types.ts';
import { prepareTextActionPrompt } from '../_shared/prompts/writing.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Verify authentication
    const user = await verifyAuth(req);
    
    // Parse and validate request
    const body = await req.json() as OpenAIRequest;
    if (!body.type || !body.data) {
      throw new Error('Invalid request format');
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY') || '',
      dangerouslyAllowBrowser: true
    });

    let result;
    let usage;

    // Handle different request types
    switch (body.type) {
      case 'text_action': {
        const prompt = prepareTextActionPrompt(body.data);
        const model = body.model || 'gpt-4';
        
        try {
          const completion = await openai.chat.completions.create({
            model,
            messages: [
              { role: 'system', content: prompt.systemPrompt },
              { role: 'user', content: prompt.userPrompt }
            ],
            temperature: prompt.temperature,
            max_tokens: prompt.maxTokens
          });

          result = completion.choices[0]?.message?.content;
          usage = {
            input_tokens: completion.usage?.prompt_tokens || 0,
            output_tokens: completion.usage?.completion_tokens || 0
          };
        } catch (openaiError) {
          console.error('OpenAI API Error:', openaiError);
          throw new Error(openaiError.message || 'Failed to process text with OpenAI');
        }
        break;
      }
      default:
        throw new Error(`Unsupported request type: ${body.type}`);
    }

    // Log the API call
    await logOpenAICall(
      user.id,
      body.type,
      body.data,
      result,
      body.model || 'gpt-4',
      usage?.input_tokens,
      usage?.output_tokens
    );

    const response: OpenAIResponse = {
      result,
      status: 'success',
      usage
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );

  } catch (error) {
    console.error('Error:', error);
    
    const response: OpenAIResponse = {
      result: null,
      status: 'error',
      error: error.message || 'An unexpected error occurred'
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: error.status || 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
}); 