import OpenAI from 'openai';
import { supabase } from './supabase';

// Initialize the OpenAI client
export const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, API calls should be made from a backend
});

// Create a custom error class for user-friendly OpenAI errors
export class OpenAIError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'OpenAIError';
  }
}

// Function to call our OpenAI edge function for text processing
export async function callOpenAI(text: string, action: 'improve' | 'expand' | 'shorten', context: any) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new OpenAIError('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/beta_openAI`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type: 'text_action',
          data: {
            text,
            action,
            context
          },
          model: 'gpt-4'
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new OpenAIError(error.error || 'Failed to process text');
    }

    const data = await response.json();
    return { content: data.result };
  } catch (error) {
    if (error instanceof OpenAIError) {
      throw error;
    }
    throw new OpenAIError('Failed to process text', error);
  }
}

// Re-export types and functions from prompt modules
export * from './prompts/userFlow';
export * from './prompts/flowLayout';
export * from './prompts/prdContent';
export * from './prompts/mvpPrd';