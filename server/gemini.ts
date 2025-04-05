import { ModelParametersSchema, type MessagePart, type MessageRole } from "@shared/schema";
import fetch, { Response } from "node-fetch";

// Add ReadableStream type augmentation to make TypeScript support getReader()
declare global {
  interface ReadableStream {
    getReader(): {
      read(): Promise<{ done: boolean; value: Uint8Array }>;
      releaseLock(): void;
    };
  }
}

// Gemini API base URL
const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1";

// Get the Gemini API key from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Validate API key is set
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not set. Please set the environment variable.");
  process.exit(1);
}

// Models available in Gemini
export const GEMINI_MODELS = {
  // Gemini 2.5 models
  "gemini-2.5-pro-preview-03-25": "models/gemini-2.5-pro-preview-03-25", // Default - Enhanced thinking and reasoning
  
  // Gemini 2.0 models
  "gemini-2.0-flash": "models/gemini-2.0-flash", // Next generation features, speed, thinking
  "gemini-2.0-flash-lite": "models/gemini-2.0-flash-lite", // Cost efficiency and low latency
  
  // Gemini 1.5 models
  "gemini-1.5-flash": "models/gemini-1.5-flash", // Fast and versatile performance
  "gemini-1.5-flash-8b": "models/gemini-1.5-flash-8b", // High volume and lower intelligence tasks
  "gemini-1.5-pro": "models/gemini-1.5-pro", // Complex reasoning tasks requiring more intelligence
  
  // Legacy models
  "gemini-pro": "models/gemini-pro", // Gemini 1.0 Pro
  "gemini-1.0-pro": "models/gemini-pro", // Legacy name mapping

  // Embeddings
  "gemini-embedding-exp": "models/gemini-embedding-exp", // Text embeddings
};

// Default model to use
const DEFAULT_MODEL = "gemini-2.5-pro-preview-03-25";

// Message format for Gemini API
export interface GeminiMessage {
  role: string;
  parts: {
    text?: string;
    inlineData?: {
      mimeType: string;
      data: string;
    };
  }[];
}

// Process message parts and convert to Gemini format
function processMessageParts(parts: MessagePart[]): GeminiMessage["parts"] {
  return parts.map(part => {
    if (part.type === "text" || part.type === "code") {
      return { text: part.text };
    } else if (part.type === "image" && part.fileData && part.mimeType) {
      return {
        inlineData: {
          mimeType: part.mimeType,
          data: part.fileData.replace(/^data:[^;]+;base64,/, ""), // Strip the data URL prefix if present
        }
      };
    }
    // Fallback to empty text if the part type is not recognized
    return { text: "" };
  });
}

// Convert our message format to Gemini API format
function convertToGeminiMessages(messages: { role: MessageRole; content: MessagePart[] }[]): GeminiMessage[] {
  return messages.map(message => ({
    role: message.role === "assistant" ? "model" : message.role,
    parts: processMessageParts(message.content),
  }));
}

// Define the response type for Gemini content generation
interface GeminiContentResponse {
  candidates: {
    content: {
      parts: {
        text?: string;
      }[];
    };
    finishReason: string;
    safetyRatings: {
      category: string;
      probability: string;
    }[];
  }[];
  promptFeedback?: {
    safetyRatings: {
      category: string;
      probability: string;
    }[];
  };
}

// Generate content with Gemini API
export async function generateContent(
  model: string, 
  messages: { role: MessageRole; content: MessagePart[] }[], 
  parameters: unknown
): Promise<GeminiContentResponse> {
  // Validate and parse parameters
  const validatedParams = ModelParametersSchema.parse(parameters);

  // Get the correct model path
  const modelPath = GEMINI_MODELS[model as keyof typeof GEMINI_MODELS] || GEMINI_MODELS[DEFAULT_MODEL];

  // Convert messages to Gemini format
  const geminiMessages = convertToGeminiMessages(messages);

  // Prepare the request body
  const requestBody = {
    contents: geminiMessages,
    generationConfig: {
      temperature: validatedParams.temperature,
      topK: validatedParams.topK,
      topP: validatedParams.topP,
      maxOutputTokens: validatedParams.maxOutputTokens,
    },
    systemInstruction: validatedParams.systemInstructions ? {
      parts: [{ text: validatedParams.systemInstructions }],
    } : undefined,
  };

  // Use the generateContent endpoint
  const endpoint = 'generateContent';
  
  // Make the API call
  const response = await fetch(
    `${GEMINI_API_BASE_URL}/${modelPath}:${endpoint}?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    }
  );

  // Handle API errors
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  // Return the JSON response with proper typing
  return await response.json() as GeminiContentResponse;
}

// Generate content with streaming
export async function generateContentStream(
  model: string, 
  messages: { role: MessageRole; content: MessagePart[] }[], 
  parameters: unknown
): Promise<Response & { body: ReadableStream }> {
  // Validate and parse parameters
  const validatedParams = ModelParametersSchema.parse(parameters);

  // Get the correct model path
  const modelPath = GEMINI_MODELS[model as keyof typeof GEMINI_MODELS] || GEMINI_MODELS[DEFAULT_MODEL];

  // Convert messages to Gemini format
  const geminiMessages = convertToGeminiMessages(messages);

  // Prepare the request body
  const requestBody = {
    contents: geminiMessages,
    generationConfig: {
      temperature: validatedParams.temperature,
      topK: validatedParams.topK,
      topP: validatedParams.topP,
      maxOutputTokens: validatedParams.maxOutputTokens,
    },
    systemInstruction: validatedParams.systemInstructions ? {
      parts: [{ text: validatedParams.systemInstructions }],
    } : undefined,
  };

  // Use the streamGenerateContent endpoint
  const endpoint = 'streamGenerateContent';
  
  // Make the API call with stream parameter
  const response = await fetch(
    `${GEMINI_API_BASE_URL}/${modelPath}:${endpoint}?key=${GEMINI_API_KEY}&alt=sse`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    }
  );

  // Handle API errors
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  // Return the response for streaming with correct typings
  return response as Response & { body: ReadableStream };
}

// Count tokens in a text (approximate)
export function countTokens(text: string): number {
  // A simple approximation: roughly 4 characters per token for English text
  return Math.ceil(text.length / 4);
}
