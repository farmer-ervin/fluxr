export interface TextActionData {
  text: string;
  action: 'improve' | 'expand' | 'shorten';
  context?: {
    section?: string;
    productContext?: string;
  };
}

export interface OpenAIRequest {
  type: 'text_action';
  data: TextActionData;
  model?: string;
}

export interface OpenAIResponse {
  result: string | null;
  status: 'success' | 'error';
  error?: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
} 