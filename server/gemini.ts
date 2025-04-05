import { ModelParametersSchema, type MessagePart, type MessageRole } from "@shared/schema";
import fetch, { Response } from "node-fetch";
import { GEMINI_API_KEY, GEMINI_API_BASE_URL, GEMINI_MODELS, DEFAULT_MODEL, validateConfig } from "./config";

// Add ReadableStream type augmentation to make TypeScript support getReader()
declare global {
  interface ReadableStream {
    getReader(): {
      read(): Promise<{ done: boolean; value: Uint8Array }>;
      releaseLock(): void;
    };
  }
}

// Validate configuration on server startup
if (!validateConfig()) {
  process.exit(1);
}

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
    console.error(`Gemini API stream error (${response.status}):`, errorText);
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  // Ensure response has a body with a readable stream
  if (!response.body) {
    console.error("Gemini API response is missing the response body");
    throw new Error("Gemini API response is missing the response body");
  }

  // Log successful streaming setup
  console.log(`Streaming response setup successfully with status ${response.status}`);
  
  // Return the response for streaming with correct typings
  return response as Response & { body: ReadableStream };
}

// Count tokens in a text (approximate)
export function countTokens(text: string): number {
  // A simple approximation: roughly 4 characters per token for English text
  return Math.ceil(text.length / 4);
}
