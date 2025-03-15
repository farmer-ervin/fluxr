import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.2.1';
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
    const configuration = new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });
    const openai = new OpenAIApi(configuration);

    let result;
    let usage;

    // Handle different request types
    switch (body.type) {
      case 'text_action': {
        const prompt = prepareTextActionPrompt(body.data);
        const model = body.model || prompt.defaultModel;
        
        const completion = await openai.createChatCompletion({
          model,
          messages: [
            { role: 'system', content: prompt.systemPrompt },
            { role: 'user', content: prompt.userPrompt }
          ],
          temperature: prompt.temperature,
          max_tokens: prompt.maxTokens
        });

        result = completion.data.choices[0]?.message?.content;
        usage = {
          input_tokens: completion.data.usage?.prompt_tokens || 0,
          output_tokens: completion.data.usage?.completion_tokens || 0
        };
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
      body.model || 'default',
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
      error: error.message
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