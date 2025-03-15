import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function verifyAuth(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }
  
  const token = authHeader.split(' ')[1];
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') as string;
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Invalid token or user not found');
  }
  
  return user;
}

export async function logOpenAICall(
  userId: string, 
  requestType: string, 
  requestPayload: any, 
  responsePayload: any,
  model: string,
  inputTokens?: number,
  outputTokens?: number
) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    await supabase.from('openai_logs').insert({
      user_id: userId,
      request_type: requestType,
      model,
      request_payload: requestPayload,
      response_payload: responsePayload,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log OpenAI call:', error);
  }
} 