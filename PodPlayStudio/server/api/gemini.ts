import fetch from 'node-fetch';
import { ModelConfig } from '@shared/schema';
import * as config from '../config';
import fs from 'fs';
import path from 'path';

// Helper type for file data
interface FileData {
  mimeType: string;
  data: Buffer;
}

/**
 * Gemini API Service
 * 
 * This module provides functions to interact with the Google Gemini API.
 */

/**
 * Generate text with Gemini models
 */
export async function generateText(
  prompt: string,
  modelConfig: ModelConfig,
  stream: boolean = false
) {
  const { 
    model = config.DEFAULT_MODEL, 
    temperature = config.DEFAULT_TEMPERATURE,
    topK = config.DEFAULT_TOP_K,
    topP = config.DEFAULT_TOP_P,
    maxOutputTokens = config.DEFAULT_MAX_OUTPUT_TOKENS,
  } = modelConfig;
  
  const apiKey = process.env.GEMINI_API_KEY || config.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('No Gemini API key provided');
  }
  
  const url = `${config.GEMINI_API_URL}/${config.GEMINI_API_VERSION}/models/${model}:${stream ? 'streamGenerateContent' : 'generateContent'}?key=${apiKey}`;
  
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
      topK,
      topP,
      maxOutputTokens,
    },
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }
    
    if (stream) {
      return response;
    } else {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate text: ${error.message}`);
    }
    throw new Error('Unknown error occurred while generating text');
  }
}

/**
 * Generate text with image input
 */
export async function generateTextWithImage(
  prompt: string,
  imageFiles: string[],
  modelConfig: ModelConfig,
  stream: boolean = false
) {
  // Vision model must be used for images
  const model = config.VISION_MODEL;
  const { 
    temperature = config.DEFAULT_TEMPERATURE,
    topK = config.DEFAULT_TOP_K,
    topP = config.DEFAULT_TOP_P,
    maxOutputTokens = config.DEFAULT_MAX_OUTPUT_TOKENS,
  } = modelConfig;
  
  const apiKey = process.env.GEMINI_API_KEY || config.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('No Gemini API key provided');
  }
  
  const url = `${config.GEMINI_API_URL}/${config.GEMINI_API_VERSION}/models/${model}:${stream ? 'streamGenerateContent' : 'generateContent'}?key=${apiKey}`;
  
  // Load the images
  const imageParts = await Promise.all(
    imageFiles.map(async (filePath) => {
      const fileData = await loadFileAsBase64(filePath);
      return {
        inlineData: {
          data: fileData.data.toString('base64'),
          mimeType: fileData.mimeType
        }
      };
    })
  );
  
  // Construct parts array with text prompt and images
  const parts = [
    { text: prompt },
    ...imageParts
  ];
  
  const requestBody = {
    contents: [
      {
        parts
      }
    ],
    generationConfig: {
      temperature,
      topK,
      topP,
      maxOutputTokens,
    },
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }
    
    if (stream) {
      return response;
    } else {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate text with image: ${error.message}`);
    }
    throw new Error('Unknown error occurred while generating text with image');
  }
}

/**
 * Helper to load file as Base64
 */
async function loadFileAsBase64(filePath: string): Promise<FileData> {
  return new Promise((resolve, reject) => {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      reject(new Error(`File not found: ${filePath}`));
      return;
    }
    
    // Get MIME type based on file extension
    const mimeType = getMimeType(filePath);
    
    // Read file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(new Error(`Failed to read file: ${err.message}`));
        return;
      }
      
      resolve({ data, mimeType });
    });
  });
}

/**
 * Get MIME type from file extension
 */
function getMimeType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  
  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mp3',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.pdf': 'application/pdf',
  };
  
  return mimeMap[extension] || 'application/octet-stream';
}

/**
 * Process streaming response
 */
export function processStreamResponse(
  response: Response,
  onChunk: (chunk: any) => void,
  onDone: () => void,
  onError: (error: Error) => void
) {
  const reader = response.body?.getReader();
  
  if (!reader) {
    onError(new Error('Failed to get response reader'));
    return;
  }
  
  // Create a decoder for decoding the stream
  const decoder = new TextDecoder('utf-8');
  
  // Process the stream
  function processStream() {
    reader.read().then(({ done, value }) => {
      if (done) {
        onDone();
        return;
      }
      
      try {
        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        
        // Parse and process each line
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          try {
            // Remove "data: " prefix if present
            const jsonStr = line.startsWith('data: ') ? line.slice(5) : line;
            const data = JSON.parse(jsonStr);
            onChunk(data);
          } catch (e) {
            // Ignore parsing errors for individual chunks
            console.warn('Error parsing chunk:', e);
          }
        }
        
        // Continue processing
        processStream();
      } catch (error) {
        if (error instanceof Error) {
          onError(error);
        } else {
          onError(new Error('Unknown error in stream processing'));
        }
      }
    }).catch(onError);
  }
  
  processStream();
}

/**
 * Count tokens for a prompt (estimation)
 * Note: This is a rough estimation, as the official token counting is not exposed via the API
 */
export function estimateTokenCount(text: string): number {
  // Very rough estimation: ~4 characters per token for English text
  return Math.ceil(text.length / 4);
}

/**
 * Extract text from Gemini API response
 */
export function extractTextFromResponse(response: any): string {
  try {
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        return candidate.content.parts.map((part: any) => part.text || '').join('');
      }
    }
    return '';
  } catch (e) {
    console.error('Error extracting text from response:', e);
    return '';
  }
}