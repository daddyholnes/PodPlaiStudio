// Gemini API Integration for PodPlay API Studio
import fs from 'fs';
import { GEMINI_API_KEY, DEFAULT_MODEL, DEFAULT_TEMPERATURE, DEFAULT_MAX_OUTPUT_TOKENS } from '../config';
import storage from '../storage';

// Define the model config interface
interface ModelConfig {
  model: string;
  temperature?: number; 
  maxOutputTokens?: number;
  topK?: number;
  topP?: number;
  stopSequences?: string[];
  streamResponse?: boolean;
}

// Define the response interface
interface Response {
  text?: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  raw?: any;
}

// Get API key from settings or environment
async function getApiKey(): Promise<string> {
  // Try to get API key from storage first
  const settings = await storage.getAppSettings();
  
  // If API key exists in settings, use it
  if (settings?.apiKey) {
    return settings.apiKey;
  }
  
  // Fallback to environment variable
  if (GEMINI_API_KEY) {
    return GEMINI_API_KEY;
  }
  
  throw new Error('No API key found. Please set your Gemini API key in settings or environment variables.');
}

// Generate text with text-only prompt
export async function generateText(
  prompt: string, 
  config: ModelConfig,
  streamResponse: boolean = false
): Promise<Response> {
  try {
    const apiKey = await getApiKey();
    
    const modelName = config?.model || DEFAULT_MODEL;
    const temperature = config?.temperature !== undefined ? config.temperature : DEFAULT_TEMPERATURE;
    const maxOutputTokens = config?.maxOutputTokens || DEFAULT_MAX_OUTPUT_TOKENS;
    
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature,
        maxOutputTokens,
        topK: config?.topK,
        topP: config?.topP,
        stopSequences: config?.stopSequences,
      }
    };
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:${streamResponse ? 'streamGenerateContent' : 'generateContent'}?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
    }
    
    if (streamResponse) {
      return response as unknown as Response;
    }
    
    const data = await response.json();
    
    // Check if response has candidates
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response candidates returned from Gemini API');
    }
    
    // Extract text from the first candidate
    const candidate = data.candidates[0];
    
    // Check for safety ratings that blocked the response
    if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'BLOCKED') {
      throw new Error('Response was blocked due to safety concerns');
    }
    
    // Extract the text from parts
    const generatedText = candidate.content.parts
      .map((part: any) => part.text || '')
      .join('');
    
    return {
      text: generatedText,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: (data.usageMetadata?.promptTokenCount || 0) + (data.usageMetadata?.candidatesTokenCount || 0),
      },
      raw: data,
    };
  } catch (error) {
    console.error('Error generating text:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Generate text with image input
export async function generateTextWithImage(
  prompt: string,
  imagePaths: string[],
  config: ModelConfig,
  streamResponse: boolean = false
): Promise<Response> {
  try {
    const apiKey = await getApiKey();
    
    const modelName = config?.model || 'gemini-pro-vision'; // Always use vision model for images
    const temperature = config?.temperature !== undefined ? config.temperature : DEFAULT_TEMPERATURE;
    const maxOutputTokens = config?.maxOutputTokens || DEFAULT_MAX_OUTPUT_TOKENS;
    
    // Prepare parts array with prompt text
    const parts: any[] = [{ text: prompt }];
    
    // Add each image to parts
    for (const imagePath of imagePaths) {
      try {
        const imageData = fs.readFileSync(imagePath);
        const base64Image = imageData.toString('base64');
        
        // Get file extension
        const extension = imagePath.split('.').pop()?.toLowerCase() || 'jpeg';
        
        // Determine MIME type
        let mimeType = 'image/jpeg'; // Default
        if (extension === 'png') {
          mimeType = 'image/png';
        } else if (extension === 'gif') {
          mimeType = 'image/gif';
        } else if (extension === 'webp') {
          mimeType = 'image/webp';
        }
        
        parts.push({
          inlineData: {
            mimeType,
            data: base64Image,
          }
        });
      } catch (err) {
        console.error(`Error reading image file ${imagePath}:`, err);
      }
    }
    
    const requestBody = {
      contents: [
        {
          parts
        }
      ],
      generationConfig: {
        temperature,
        maxOutputTokens,
        topK: config?.topK,
        topP: config?.topP,
        stopSequences: config?.stopSequences,
      }
    };
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:${streamResponse ? 'streamGenerateContent' : 'generateContent'}?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
    }
    
    if (streamResponse) {
      return response as unknown as Response;
    }
    
    const data = await response.json();
    
    // Check if response has candidates
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response candidates returned from Gemini API');
    }
    
    // Extract text from the first candidate
    const candidate = data.candidates[0];
    
    // Check for safety ratings that blocked the response
    if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'BLOCKED') {
      throw new Error('Response was blocked due to safety concerns');
    }
    
    // Extract the text from parts
    const generatedText = candidate.content.parts
      .map((part: any) => part.text || '')
      .join('');
    
    return {
      text: generatedText,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: (data.usageMetadata?.promptTokenCount || 0) + (data.usageMetadata?.candidatesTokenCount || 0),
      },
      raw: data,
    };
  } catch (error) {
    console.error('Error generating text with image:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Process streaming response
export async function processStreamResponse(
  response: Response,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: Error) => void
) {
  try {
    if (!response || !('body' in response)) {
      throw new Error('Invalid response object for streaming');
    }
    
    const reader = (response as any).body?.getReader();
    
    if (!reader) {
      throw new Error('Cannot get reader from response');
    }
    
    const decoder = new TextDecoder();
    
    let buffer = '';
    
    async function readStream() {
      try {
        const { done, value } = await reader.read();
        
        if (done) {
          onDone();
          return;
        }
        
        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Process the buffer line by line
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonData = line.slice(6); // Remove 'data: ' prefix
            
            if (jsonData === '[DONE]') {
              onDone();
              return;
            }
            
            try {
              const parsedData = JSON.parse(jsonData);
              
              // Check for error
              if (parsedData.error) {
                onError(new Error(parsedData.error.message || 'Unknown API error'));
                return;
              }
              
              // Extract text from candidates
              if (parsedData.candidates && parsedData.candidates.length > 0) {
                const candidate = parsedData.candidates[0];
                
                if (candidate.content && candidate.content.parts) {
                  const text = candidate.content.parts
                    .map((part: any) => part.text || '')
                    .join('');
                  
                  if (text) {
                    onChunk(text);
                  }
                }
              }
            } catch (e) {
              console.error('Error parsing JSON from stream:', e);
            }
          }
        }
        
        // Continue reading
        readStream();
      } catch (error) {
        onError(error instanceof Error ? error : new Error('Unknown error in stream processing'));
      }
    }
    
    // Start reading the stream
    readStream();
  } catch (error) {
    onError(error instanceof Error ? error : new Error('Unknown error in stream setup'));
  }
}

// Extract text from API response
export function extractTextFromResponse(response: Response): string {
  if (response.error) {
    return `Error: ${response.error}`;
  }
  
  return response.text || '';
}

// Count tokens for a given text (estimate)
export function estimateTokenCount(text: string): number {
  // This is a very rough estimate: about 4 characters per token
  return Math.ceil(text.length / 4);
}