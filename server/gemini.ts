import { ModelParametersSchema, type MessagePart, type MessageRole } from "@shared/schema";
import fetch from "node-fetch";

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
  "gemini-pro": "models/gemini-pro",
  "gemini-flash": "models/gemini-1.5-flash",
  "gemini-ultra": "models/gemini-ultra",
};

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

// Generate content with Gemini API
export async function generateContent(
  model: string, 
  messages: { role: MessageRole; content: MessagePart[] }[], 
  parameters: unknown
) {
  // Validate and parse parameters
  const validatedParams = ModelParametersSchema.parse(parameters);

  // Get the correct model path
  const modelPath = GEMINI_MODELS[model as keyof typeof GEMINI_MODELS] || GEMINI_MODELS["gemini-pro"];

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

  // Determine the API endpoint (generative or chat)
  const endpoint = geminiMessages.length > 1 ? 'generateContent' : 'generateContent';
  
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

  // Return the JSON response
  return await response.json();
}

// Generate content with streaming
export async function generateContentStream(
  model: string, 
  messages: { role: MessageRole; content: MessagePart[] }[], 
  parameters: unknown
) {
  // Validate and parse parameters
  const validatedParams = ModelParametersSchema.parse(parameters);

  // Get the correct model path
  const modelPath = GEMINI_MODELS[model as keyof typeof GEMINI_MODELS] || GEMINI_MODELS["gemini-pro"];

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

  // Determine the API endpoint (generative or chat)
  const endpoint = geminiMessages.length > 1 ? 'streamGenerateContent' : 'streamGenerateContent';
  
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

  // Return the response for streaming
  return response;
}

// Count tokens in a text (approximate)
export function countTokens(text: string): number {
  // A simple approximation: roughly 4 characters per token for English text
  return Math.ceil(text.length / 4);
}
