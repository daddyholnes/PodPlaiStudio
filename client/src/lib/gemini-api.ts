import { MessagePart, MessageRole, ModelParameters } from '@/../../shared/schema';
import { apiRequest } from './queryClient';

export interface GeminiRequest {
  messages: {
    role: MessageRole;
    content: MessagePart[];
  }[];
  modelParams?: ModelParameters;
}

// Function to generate text using the Gemini API
export async function generateText(
  prompt: string | MessagePart[], 
  modelParams?: ModelParameters
): Promise<string> {
  const content = typeof prompt === 'string' 
    ? [{ type: 'text', text: prompt }] as MessagePart[]
    : prompt;
    
  const request: GeminiRequest = {
    messages: [{ role: 'user', content }],
    modelParams
  };

  const response = await apiRequest('POST', '/api/gemini/generate', request);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate text');
  }
  
  return data.text;
}

// Function to generate streaming text using WebSockets
export function generateTextStream(
  prompt: string | MessagePart[],
  modelParams?: ModelParameters
): string {
  const content = typeof prompt === 'string'
    ? [{ type: 'text', text: prompt }] as MessagePart[]
    : prompt;
    
  const requestId = Date.now().toString();
  
  // Return the requestId which will be used to match WebSocket responses
  return requestId;
}

// Function to chat with the Gemini API
export async function chatWithGemini(
  messages: {
    role: MessageRole;
    content: MessagePart[];
  }[],
  modelParams?: ModelParameters
): Promise<string> {
  const request: GeminiRequest = {
    messages,
    modelParams
  };

  const response = await apiRequest('POST', '/api/gemini/chat', request);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to chat with Gemini');
  }
  
  return data.text;
}

// Function to chat with streaming responses using WebSockets
export function chatWithGeminiStream(
  messages: {
    role: MessageRole;
    content: MessagePart[];
  }[],
  modelParams?: ModelParameters
): string {
  const requestId = Date.now().toString();
  
  // Return the requestId which will be used to match WebSocket responses
  return requestId;
}

// Function to count tokens for a given text
export async function countTokens(text: string): Promise<number> {
  const response = await apiRequest('POST', '/api/gemini/tokens', { text });
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to count tokens');
  }
  
  return data.tokens;
}

// Function to execute code with Gemini
export async function executeCode(
  code: string,
  language?: string
): Promise<{ output: string; error?: string }> {
  const response = await apiRequest('POST', '/api/gemini/execute', { 
    code,
    language 
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to execute code');
  }
  
  return {
    output: data.output,
    error: data.error
  };
}