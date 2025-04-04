import { apiRequest } from './queryClient';

export interface GeminiParameters {
  temperature: number;
  maxOutputTokens: number;
  topK: number;
  topP: number;
  stream: boolean;
  systemInstructions?: string;
}

export interface GeminiMessage {
  role: 'user' | 'assistant' | 'system';
  content: {
    type: string;
    text?: string;
    fileData?: string;
    mimeType?: string;
  }[];
}

// Generate content with the Gemini API
export async function generateContent(
  model: string,
  messages: GeminiMessage[],
  parameters: GeminiParameters
) {
  try {
    const response = await apiRequest('POST', '/api/generate', {
      model,
      messages,
      parameters
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating content:', error);
    throw error;
  }
}

// Function to estimate token count
export function estimateTokenCount(text: string): number {
  // A very rough estimation of token count
  // On average, 1 token is roughly 4 characters for English text
  // This is a very simple approximation and can vary widely
  return Math.ceil(text.length / 4);
}

// Upload a file and return its base64 representation
export async function uploadFile(file: File): Promise<{
  fileData: string;
  mimeType: string;
  filename: string;
  size: number;
}> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`File upload failed: ${error}`);
  }
  
  return await response.json();
}
