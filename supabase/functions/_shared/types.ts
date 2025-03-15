export interface TextActionRequest {
  text: string;
  action: 'improve' | 'expand' | 'shorten';
  context?: {
    section?: string;
    productContext?: string;
  };
}

export interface OpenAIRequest {
  type: 'text_action';
  data: TextActionRequest;
  model?: string;
}

export interface OpenAIResponse {
  result: any;
  status: 'success' | 'error';
  error?: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
} 