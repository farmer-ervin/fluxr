import OpenAI from 'openai';

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

// Re-export types and functions from prompt modules
export * from './prompts/userFlow';
export * from './prompts/flowLayout';
export * from './prompts/prdContent';
export * from './prompts/mvpPrd';