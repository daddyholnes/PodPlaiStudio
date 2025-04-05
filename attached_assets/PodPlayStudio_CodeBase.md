# PodPlay API Studio - Complete Code Base

## Table of Contents
1. [Server Configuration](#server-configuration)
2. [Gemini API Integration](#gemini-api-integration)
3. [Server Routes and WebSocket](#server-routes-and-websocket)
4. [Storage Implementation](#storage-implementation)
5. [Terminal Integration](#terminal-integration)
6. [Shared Schema](#shared-schema)
7. [Client Components](#client-components)

## Server Configuration

```typescript

// server/config.ts
// Centralized configuration for the PodPlay API Studio
// Contains environment variables and shared configuration settings

// Import required modules
import os from 'os';
import { GEMINI_MODELS, DEFAULT_MODEL_ID } from "@shared/schema";

// Get the Gemini API key from environment variables, checking both process.env and os.environ
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Log the API key status (masked for security)
console.log("Gemini API Key Status:", GEMINI_API_KEY ? "Found" : "Not found");

// Check if API key exists
export const isApiKeyConfigured = !!GEMINI_API_KEY;

// Get a masked version of the API key for display (e.g. "GEMINI_API_****")
export const getMaskedApiKey = () => {
  if (!isApiKeyConfigured) return "GEMINI_API_KEY not set";
  return `GEMINI_${'*'.repeat(Math.max(GEMINI_API_KEY.length - 7, 4))}`;
};

// Gemini API base URL
export const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1";

// Default model to use
export const DEFAULT_MODEL = DEFAULT_MODEL_ID;

// Validate the application configuration
export const validateConfig = () => {
  console.log("Environment check for Gemini API key:");
  console.log("- process.env.GEMINI_API_KEY present:", !!process.env.GEMINI_API_KEY);
  console.log("- API Key first 4 chars:", GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 4) + '...' : 'None');
  console.log("- API Key length:", GEMINI_API_KEY?.length || 0);
  
  if (!isApiKeyConfigured) {
    console.error("GEMINI_API_KEY is not set. Please set the environment variable.");
    return false;
  }
  
  console.log("Configuration validated successfully");
  return true;
};```

## Gemini API Integration

```typescript

// server/gemini.ts
import { ModelParametersSchema, type MessagePart, type MessageRole, GEMINI_MODELS, type GeminiModelId } from "@shared/schema";
import fetch, { Response } from "node-fetch";
import { GEMINI_API_KEY, GEMINI_API_BASE_URL, DEFAULT_MODEL, validateConfig } from "./config";

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
  const modelId = model as GeminiModelId;
  const fallbackId = DEFAULT_MODEL as GeminiModelId;
  const modelPath = (modelId in GEMINI_MODELS) 
    ? GEMINI_MODELS[modelId].apiPath 
    : GEMINI_MODELS[fallbackId].apiPath;

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
    systemInstructions: validatedParams.systemInstructions ? {
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
  const modelId = model as GeminiModelId;
  const fallbackId = DEFAULT_MODEL as GeminiModelId;
  const modelPath = (modelId in GEMINI_MODELS) 
    ? GEMINI_MODELS[modelId].apiPath 
    : GEMINI_MODELS[fallbackId].apiPath;

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
    systemInstructions: validatedParams.systemInstructions ? {
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
```

## Server Routes and WebSocket

```typescript

// server/routes.ts
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { generateContent, generateContentStream, countTokens } from "./gemini";
import { isApiKeyConfigured, getMaskedApiKey, GEMINI_API_KEY, validateConfig } from "./config";
import { 
  MessageRoleEnum, 
  MessageRole,
  MessagePartTypeEnum,
  MessagePartType,
  ModelParametersSchema, 
  insertConversationSchema, 
  insertMessageSchema,
  MessagePart,
  MessagePartSchema
} from "@shared/schema";
import { z } from "zod";

// Extend WebSocket type to include isAlive property
declare module "ws" {
  interface WebSocket {
    isAlive: boolean;
    clientId: string;
  }
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server with a distinct path to avoid conflicts with Vite
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    // Increase timeout to prevent frequent disconnects
    clientTracking: true,
    // Add ping interval to keep connections alive
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      // Below options specified as default values
      concurrencyLimit: 10,
      threshold: 1024 // Size (in bytes) below which messages should not be compressed
    }
  });
  console.log('WebSocket server initialized at path: /ws');
  
  // Set up ping interval to keep connections alive
  const pingInterval = setInterval(() => {
    let disconnectedClients = 0;
    
    wss.clients.forEach((client) => {
      if (client.isAlive === false) {
        disconnectedClients++;
        // If a client didn't respond to the previous ping, terminate it
        client.terminate();
        return;
      }
      
      // Mark the client as not alive, it will be marked as alive when it responds to ping
      client.isAlive = false;
      
      // Use WebSocket standard ping
      try {
        client.ping();
      } catch (err) {
        console.error('Error sending ping:', err);
      }
      
      // Also send a JSON ping message for clients that may not support WebSocket ping/pong
      try {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        }
      } catch (err) {
        console.error('Error sending JSON ping:', err);
      }
    });
    
    if (disconnectedClients > 0) {
      console.log(`Terminated ${disconnectedClients} non-responsive clients`);
    }
  }, 20000); // Ping interval: 20 seconds
  
  // Generate a unique ID for each client
  let clientIdCounter = 0;
  
  // Handle WebSocket connections
  wss.on('connection', (ws, req) => {
    // Assign a unique client ID and track connection state
    const clientId = `client_${Date.now()}_${++clientIdCounter}`;
    ws.clientId = clientId;
    ws.isAlive = true;
    
    console.log(`Client connected to WebSocket (ID: ${clientId})`);
    
    // Handle standard WebSocket ping-pong
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    
    // Handle close event
    ws.on('close', () => {
      console.log(`Client disconnected from WebSocket (ID: ${clientId})`);
    });
    
    // Handle error event
    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
    });
    
    ws.on('message', async (message) => {
      try {
        // Try to parse as JSON
        const data = JSON.parse(message.toString());
        
        // Handle custom ping/pong messages for clients that don't support WebSocket ping
        if (data.type === 'ping') {
          ws.isAlive = true;
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now(), echo: data.timestamp }));
          return;
        }
        
        // Mark the client as alive on any message
        ws.isAlive = true;
        
        console.log('WebSocket message received:', data.type, data.conversationId || '');
        
        // Handle different message types
        switch (data.type) {
          case "generate": {
            // Handle text generation (streaming or non-streaming)
            const { model, messages, parameters, conversationId, stream } = data;
            
            if (stream) {
              // Start the streaming response
              try {
                const streamResponse = await generateContentStream(model, messages, parameters);
                
                // Setup reading the stream
                const reader = streamResponse.body?.getReader();
                if (!reader) {
                  ws.send(JSON.stringify({ 
                    type: "error", 
                    error: "Failed to get stream reader" 
                  }));
                  return;
                }
                
                // Process the stream chunks
                const decoder = new TextDecoder();
                let buffer = "";
                
                const processStream = async () => {
                  try {
                    const { done, value } = await reader.read();
                    
                    if (done) {
                      ws.send(JSON.stringify({ type: "done" }));
                      return;
                    }
                    
                    // Decode and process the chunk
                    buffer += decoder.decode(value, { stream: true });
                    
                    // Split by newlines to get SSE events
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || "";
                    
                    for (const line of lines) {
                      if (line.startsWith('data:')) {
                        const data = line.slice(5).trim();
                        if (data === '[DONE]') {
                          ws.send(JSON.stringify({ type: "done" }));
                          return;
                        }
                        
                        try {
                          const parsedData = JSON.parse(data);
                          
                          // Extract the content and send it
                          if (parsedData.candidates && parsedData.candidates[0]?.content) {
                            ws.send(JSON.stringify({ 
                              type: "chunk", 
                              content: parsedData.candidates[0].content,
                              conversationId
                            }));
                          }
                        } catch (e) {
                          console.error('Error parsing JSON from stream:', e);
                        }
                      }
                    }
                    
                    // Continue processing the stream
                    processStream();
                  } catch (error) {
                    console.error('Error processing stream:', error);
                    ws.send(JSON.stringify({ 
                      type: "error", 
                      error: error instanceof Error ? error.message : String(error) 
                    }));
                  }
                };
                
                processStream();
              } catch (error) {
                console.error('Error generating content stream:', error);
                ws.send(JSON.stringify({ 
                  type: "error", 
                  error: error instanceof Error ? error.message : String(error) 
                }));
              }
            } else {
              // Non-streaming generation
              try {
                const response = await generateContent(model, messages, parameters);
                
                ws.send(JSON.stringify({
                  type: "result",
                  content: response.candidates?.[0]?.content,
                  conversationId
                }));
              } catch (error) {
                console.error('Error generating content:', error);
                ws.send(JSON.stringify({ 
                  type: "error", 
                  error: error instanceof Error ? error.message : String(error) 
                }));
              }
            }
            break;
          }
          
          case "chat": {
            // Handle chat messages (streaming or non-streaming)
            const { model, messages, parameters, conversationId, stream } = data;
            console.log("Received chat message:", {
              model,
              conversationId,
              stream,
              messageCount: messages?.length || 0,
              parameters
            });
            
            if (stream) {
              // Use the same stream handling as the generate endpoint
              try {
                console.log("Starting streaming chat response for conversationId:", conversationId);
                const streamResponse = await generateContentStream(model, messages, parameters);
                console.log("Got stream response from Gemini API");
                
                // Setup reading the stream
                const reader = streamResponse.body?.getReader();
                if (!reader) {
                  console.error("Failed to get stream reader");
                  ws.send(JSON.stringify({ 
                    type: "error", 
                    error: "Failed to get stream reader" 
                  }));
                  return;
                }
                
                // Process the stream chunks
                const decoder = new TextDecoder();
                let buffer = "";
                
                const processStream = async () => {
                  try {
                    const { done, value } = await reader.read();
                    
                    if (done) {
                      ws.send(JSON.stringify({ type: "done" }));
                      return;
                    }
                    
                    // Decode and process the chunk
                    buffer += decoder.decode(value, { stream: true });
                    
                    // Split by newlines to get SSE events
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || "";
                    
                    for (const line of lines) {
                      if (line.startsWith('data:')) {
                        const data = line.slice(5).trim();
                        if (data === '[DONE]') {
                          ws.send(JSON.stringify({ type: "done" }));
                          return;
                        }
                        
                        try {
                          const parsedData = JSON.parse(data);
                          
                          // Extract the content and send it
                          if (parsedData.candidates && parsedData.candidates[0]?.content) {
                            ws.send(JSON.stringify({ 
                              type: "chunk", 
                              content: parsedData.candidates[0].content,
                              conversationId
                            }));
                          }
                        } catch (e) {
                          console.error('Error parsing JSON from stream:', e);
                        }
                      }
                    }
                    
                    // Continue processing the stream
                    processStream();
                  } catch (error) {
                    console.error('Error processing stream:', error);
                    ws.send(JSON.stringify({ 
                      type: "error", 
                      error: error instanceof Error ? error.message : String(error) 
                    }));
                  }
                };
                
                processStream();
              } catch (error) {
                console.error('Error generating chat stream:', error);
                ws.send(JSON.stringify({ 
                  type: "error", 
                  error: error instanceof Error ? error.message : String(error) 
                }));
              }
            } else {
              // Non-streaming chat
              try {
                const response = await generateContent(model, messages, parameters);
                
                ws.send(JSON.stringify({
                  type: "result",
                  content: response.candidates?.[0]?.content,
                  conversationId
                }));
              } catch (error) {
                console.error('Error generating chat content:', error);
                ws.send(JSON.stringify({ 
                  type: "error", 
                  error: error instanceof Error ? error.message : String(error) 
                }));
              }
            }
            break;
          }
          
          case "code": {
            // Handle code generation (streaming or non-streaming)
            const { model, messages, parameters, conversationId, stream } = data;
            
            // Code generation uses the same API as text generation but with different prompt formatting
            if (stream) {
              try {
                const streamResponse = await generateContentStream(model, messages, parameters);
                
                // Setup reading the stream
                const reader = streamResponse.body?.getReader();
                if (!reader) {
                  ws.send(JSON.stringify({ 
                    type: "error", 
                    error: "Failed to get stream reader" 
                  }));
                  return;
                }
                
                // Process the stream chunks
                const decoder = new TextDecoder();
                let buffer = "";
                
                const processStream = async () => {
                  try {
                    const { done, value } = await reader.read();
                    
                    if (done) {
                      ws.send(JSON.stringify({ type: "done" }));
                      return;
                    }
                    
                    // Decode and process the chunk
                    buffer += decoder.decode(value, { stream: true });
                    
                    // Split by newlines to get SSE events
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || "";
                    
                    for (const line of lines) {
                      if (line.startsWith('data:')) {
                        const data = line.slice(5).trim();
                        if (data === '[DONE]') {
                          ws.send(JSON.stringify({ type: "done" }));
                          return;
                        }
                        
                        try {
                          const parsedData = JSON.parse(data);
                          
                          // Extract the content and send it
                          if (parsedData.candidates && parsedData.candidates[0]?.content) {
                            ws.send(JSON.stringify({ 
                              type: "chunk", 
                              content: parsedData.candidates[0].content,
                              conversationId
                            }));
                          }
                        } catch (e) {
                          console.error('Error parsing JSON from stream:', e);
                        }
                      }
                    }
                    
                    // Continue processing the stream
                    processStream();
                  } catch (error) {
                    console.error('Error processing stream:', error);
                    ws.send(JSON.stringify({ 
                      type: "error", 
                      error: error instanceof Error ? error.message : String(error) 
                    }));
                  }
                };
                
                processStream();
              } catch (error) {
                console.error('Error generating code stream:', error);
                ws.send(JSON.stringify({ 
                  type: "error", 
                  error: error instanceof Error ? error.message : String(error) 
                }));
              }
            } else {
              // Non-streaming code generation
              try {
                const response = await generateContent(model, messages, parameters);
                
                ws.send(JSON.stringify({
                  type: "result",
                  content: response.candidates?.[0]?.content,
                  conversationId
                }));
              } catch (error) {
                console.error('Error generating code content:', error);
                ws.send(JSON.stringify({ 
                  type: "error", 
                  error: error instanceof Error ? error.message : String(error) 
                }));
              }
            }
            break;
          }
          
          case "token_count": {
            // Handle token counting
            try {
              const { text } = data;
              const count = countTokens(text);
              ws.send(JSON.stringify({
                type: "token_count",
                count
              }));
            } catch (error) {
              console.error('Error counting tokens:', error);
              ws.send(JSON.stringify({ 
                type: "error", 
                error: error instanceof Error ? error.message : String(error) 
              }));
            }
            break;
          }
          
          default:
            ws.send(JSON.stringify({ 
              type: "error", 
              error: `Unknown message type: ${data.type}` 
            }));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({ 
          type: "error", 
          error: error instanceof Error ? error.message : String(error) 
        }));
      }
    });
    
    ws.on('close', (code, reason) => {
      console.log(`Client disconnected from WebSocket with code ${code} and reason: ${reason || 'No reason provided'}`);
      
      // Clean up any resources or ongoing operations for this connection
      ws.isAlive = false;
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  // Set up an interval to clean up dead connections
  const cleanupInterval = setInterval(() => {
    wss.clients.forEach((client) => {
      if (!client.isAlive) {
        console.log('Terminating inactive client');
        return client.terminate();
      }
      
      client.isAlive = false;
    });
  }, 60000); // Check once per minute
  
  // Clean up intervals when server shuts down
  httpServer.on('close', () => {
    clearInterval(pingInterval);
    clearInterval(cleanupInterval);
    console.log('WebSocket server shut down');
  });
  
  // API Routes
  
  // Get API status and check if API key is configured
  app.get('/api/status', (req, res) => {
    // Run validation check with detailed logging
    validateConfig();
    
    res.json({ 
      status: 'ok', 
      apiKeyConfigured: isApiKeyConfigured,
      apiKeyMasked: isApiKeyConfigured ? getMaskedApiKey() : undefined,
      apiKeyLength: GEMINI_API_KEY.length,
      apiKeyFirstChars: GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 4) + '...' : 'None'
    });
  });
  
  // Debug endpoint for API key verification
  app.get('/api/debug/env', (req, res) => {
    res.json({
      envCheck: {
        hasApiKey: !!GEMINI_API_KEY,
        apiKeyLength: GEMINI_API_KEY?.length || 0,
        apiKeyFirstChars: GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 4) + '...' : 'None',
        validationResult: validateConfig(),
        processEnvKeys: Object.keys(process.env)
          .filter(key => !key.includes('KEY') && !key.includes('TOKEN'))
      }
    });
  });
  
  // Conversations
  app.get('/api/conversations', async (req, res) => {
    try {
      const conversations = await storage.getConversations();
      res.json(conversations);
    } catch (error) {
      console.error('Error getting conversations:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  app.post('/api/conversations', async (req, res) => {
    try {
      console.log('Attempting to create conversation, request body:', req.body);
      const validatedData = insertConversationSchema.parse(req.body);
      console.log('Validated data:', validatedData);
      const conversation = await storage.createConversation(validatedData);
      console.log('Created conversation:', conversation);
      res.status(201).json(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  app.get('/api/conversations/:id', async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      
      res.json(conversation);
    } catch (error) {
      console.error('Error getting conversation:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  app.patch('/api/conversations/:id', async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { title } = req.body;
      
      if (typeof title !== 'string') {
        return res.status(400).json({ error: 'Title must be a string' });
      }
      
      const conversation = await storage.updateConversation(conversationId, title);
      
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      
      res.json(conversation);
    } catch (error) {
      console.error('Error updating conversation:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  app.delete('/api/conversations/:id', async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const success = await storage.deleteConversation(conversationId);
      
      if (!success) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Messages
  app.get('/api/conversations/:id/messages', async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await storage.getMessages(conversationId);
      res.json(messages);
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  app.post('/api/conversations/:id/messages', async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      
      // Validate the conversation exists
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      
      // Validate the message data
      const messageData = {
        ...req.body,
        conversationId
      };
      
      const validatedData = insertMessageSchema.parse(messageData);
      const message = await storage.createMessage(validatedData);
      
      res.status(201).json(message);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Generate content (non-streaming)
  app.post('/api/gemini/generate', async (req, res) => {
    try {
      // Validate request body using Zod
      const schema = z.object({
        model: z.string(),
        prompt: z.array(z.object({
          type: z.string(),
          text: z.string().optional(),
          mimeType: z.string().optional(),
          fileData: z.string().optional(),
        })),
        params: ModelParametersSchema
      });
      
      const { model, prompt, params } = schema.parse(req.body);
      
      // Format as a single user message with safely constructed MessagePart objects
      const messages = [{
        role: 'user' as MessageRole,
        content: prompt.map(p => {
          // Create a safe MessagePart object directly
          const partType = ((p.type === 'text' || p.type === 'code' || p.type === 'image') 
                ? p.type : 'text') as MessagePartType;
                
          // Build object with only the properties that exist
          const messagePart: MessagePart = { type: partType };
          if (p.text) messagePart.text = p.text;
          if (p.mimeType) messagePart.mimeType = p.mimeType;
          if (p.fileData) messagePart.fileData = p.fileData;
          
          return messagePart;
        })
      }];
      
      // Generate content using Gemini API
      const response = await generateContent(model, messages, params);
      
      // Extract the text from the response
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      res.json({ text });
    } catch (error) {
      console.error('Error generating content:', error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Generate content with streaming
  app.get('/api/gemini/generate-stream', async (req, res) => {
    try {
      // Get query parameters
      const { prompt: promptJson, model, params: paramsJson } = req.query;
      
      if (!promptJson || !model || !paramsJson) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      // Parse the JSON strings
      const prompt = JSON.parse(promptJson as string);
      const params = JSON.parse(paramsJson as string);
      
      // Format as a single user message with safely constructed MessagePart objects
      const messages = [{
        role: 'user' as MessageRole,
        content: prompt.map((p: any) => {
          // Create a safe MessagePart object directly
          const partType = ((p.type === 'text' || p.type === 'code' || p.type === 'image') 
                ? p.type : 'text') as MessagePartType;
                
          // Build object with only the properties that exist
          const messagePart: MessagePart = { type: partType };
          if (p.text) messagePart.text = p.text;
          if (p.mimeType) messagePart.mimeType = p.mimeType;
          if (p.fileData) messagePart.fileData = p.fileData;
          
          return messagePart;
        })
      }];
      
      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Generate streaming content
      const streamResponse = await generateContentStream(model as string, messages, params);
      
      // Pipe the stream to the response
      streamResponse.body?.pipe(res);
      
      // Handle client disconnect
      req.on('close', () => {
        res.end();
      });
    } catch (error) {
      console.error('Error generating streaming content:', error);
      res.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : String(error) })}\n\n`);
      res.end();
    }
  });
  
  // Chat message (non-streaming)
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      // Validate request body using Zod
      const schema = z.object({
        model: z.string(),
        messages: z.array(z.object({
          role: MessageRoleEnum,
          content: z.array(z.any())
        })),
        params: ModelParametersSchema
      });
      
      const { model, messages, params } = schema.parse(req.body);
      
      // Generate content using Gemini API
      const response = await generateContent(model, messages, params);
      
      // Extract the text from the response
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      res.json({ text });
    } catch (error) {
      console.error('Error generating chat response:', error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Chat message with streaming
  app.get('/api/gemini/chat-stream', async (req, res) => {
    try {
      // Get query parameters
      const { messages: messagesJson, model, params: paramsJson } = req.query;
      
      if (!messagesJson || !model || !paramsJson) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      // Parse the JSON strings
      const messages = JSON.parse(messagesJson as string);
      const params = JSON.parse(paramsJson as string);
      
      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Generate streaming content
      const streamResponse = await generateContentStream(model as string, messages, params);
      
      // Pipe the stream to the response
      streamResponse.body?.pipe(res);
      
      // Handle client disconnect
      req.on('close', () => {
        res.end();
      });
    } catch (error) {
      console.error('Error generating streaming chat response:', error);
      res.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : String(error) })}\n\n`);
      res.end();
    }
  });
  
  // Token counting
  app.post('/api/gemini/tokens/count', async (req, res) => {
    try {
      // Validate request body using Zod
      const schema = z.object({
        text: z.string()
      });
      
      const { text } = schema.parse(req.body);
      
      // Use the countTokens function from gemini.ts
      const count = countTokens(text);
      
      res.json({ count });
    } catch (error) {
      console.error('Error counting tokens:', error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Code execution endpoint
  app.post('/api/gemini/code/execute', async (req, res) => {
    try {
      // Validate request body using Zod
      const schema = z.object({
        code: z.string(),
        language: z.string().default('javascript')
      });
      
      const { code, language } = schema.parse(req.body);
      
      // For security, we'll do a simple code execution simulation
      // DO NOT RUN ARBITRARY CODE IN PRODUCTION!
      let output = '';
      let error;
      
      try {
        // For demo purposes only - NEVER do this in production
        if (language === 'javascript') {
          // Simulate code execution
          output = `[Simulated JavaScript execution]\n\nCode analysis:\n- Language: JavaScript\n- Length: ${code.length} characters\n- Contains ${code.split('\n').length} lines\n\nOutput would be shown here in a real execution environment.`;
        } else {
          output = `[Simulated ${language} execution]\n\nSimulated output for ${language}.\nOnly JavaScript is executed in this demo.`;
        }
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      }
      
      res.json({ output, error });
    } catch (error) {
      console.error('Error executing code:', error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // File upload
  app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Read the file as base64
      const filePath = req.file.path;
      const fileData = fs.readFileSync(filePath);
      const base64Data = fileData.toString('base64');
      
      // Return file information
      res.json({
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        fileData: `data:${req.file.mimetype};base64,${base64Data}`
      });
      
      // Clean up the file
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  return httpServer;
}
```

## Storage Implementation

```typescript

// server/storage.ts
import {
  users,
  conversations,
  messages,
  type User,
  type InsertUser,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Conversation methods
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversations(): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, title: string): Promise<Conversation | undefined>;
  deleteConversation(id: number): Promise<boolean>;
  
  // Message methods
  getMessages(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private conversationsMap: Map<number, Conversation>;
  private messagesMap: Map<number, Message>;
  
  private userIdCounter: number;
  private conversationIdCounter: number;
  private messageIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.conversationsMap = new Map();
    this.messagesMap = new Map();
    
    this.userIdCounter = 1;
    this.conversationIdCounter = 1;
    this.messageIdCounter = 1;
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Conversation methods
  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversationsMap.get(id);
  }
  
  async getConversations(): Promise<Conversation[]> {
    return Array.from(this.conversationsMap.values()).sort((a, b) => {
      // Sort by createdAt in descending order (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
  
  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.conversationIdCounter++;
    const now = new Date();
    const conversation: Conversation = {
      ...insertConversation,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.conversationsMap.set(id, conversation);
    return conversation;
  }
  
  async updateConversation(id: number, title: string): Promise<Conversation | undefined> {
    const conversation = this.conversationsMap.get(id);
    if (!conversation) return undefined;
    
    const updatedConversation = {
      ...conversation,
      title,
      updatedAt: new Date()
    };
    
    this.conversationsMap.set(id, updatedConversation);
    return updatedConversation;
  }
  
  async deleteConversation(id: number): Promise<boolean> {
    if (!this.conversationsMap.has(id)) return false;
    
    // Delete all messages in this conversation
    const messagesToDelete = Array.from(this.messagesMap.entries())
      .filter(([_, message]) => message.conversationId === id);
    
    for (const [messageId] of messagesToDelete) {
      this.messagesMap.delete(messageId);
    }
    
    return this.conversationsMap.delete(id);
  }
  
  // Message methods
  async getMessages(conversationId: number): Promise<Message[]> {
    return Array.from(this.messagesMap.values())
      .filter(message => message.conversationId === conversationId)
      .sort((a, b) => {
        // Sort by createdAt (oldest first)
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const message: Message = {
      ...insertMessage,
      id,
      createdAt: new Date()
    };
    
    this.messagesMap.set(id, message);
    
    // Update the conversation's updatedAt timestamp
    const conversation = this.conversationsMap.get(insertMessage.conversationId);
    if (conversation) {
      this.conversationsMap.set(insertMessage.conversationId, {
        ...conversation,
        updatedAt: new Date()
      });
    }
    
    return message;
  }
}

// Export a singleton instance of the storage
export const storage = new MemStorage();
```

## Terminal Integration

```typescript
// server/routes/terminal.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Store terminal sessions
const sessions = new Map();

// Create a simulated terminal service
class SimulatedTerminal {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.cwd = process.cwd();
    this.env = { ...process.env };
    this.onData = null;
    this.onExit = null;
  }

  write(data) {
    if (this.onData) {
      // Simulate response with a slight delay
      setTimeout(() => {
        // Process the command
        const output = this.processCommand(data.toString().trim());
        this.onData(output);
      }, 50);
    }
  }

  processCommand(command) {
    // Simple command simulation
    if (command.startsWith('cd ')) {
      const dir = command.substring(3);
      this.cwd = path.resolve(this.cwd, dir);
      return `Changed directory to ${this.cwd}\r\n`;
    }
    
    if (command === 'ls' || command === 'dir') {
      try {
        const files = fs.readdirSync(this.cwd);
        return files.join('\r\n') + '\r\n';
      } catch (error) {
        return `Error: ${error.message}\r\n`;
      }
    }
    
    if (command === 'pwd') {
      return `${this.cwd}\r\n`;
    }
    
    if (command.startsWith('echo ')) {
      const text = command.substring(5);
      return `${text}\r\n`;
    }
    
    if (command === 'date') {
      return `${new Date().toString()}\r\n`;
    }
    
    if (command.startsWith('node ') || command === 'node') {
      return '[Simulated Node.js execution]\r\n';
    }
    
    if (command.startsWith('python ') || command === 'python') {
      return '[Simulated Python execution]\r\n';
    }

    // For any other command, return a simulated response
    return `Simulated execution of command: ${command}\r\n`;
  }

  kill() {
    // Clean up resources
    if (this.onExit) {
      this.onExit(0);
    }
  }

  resize(cols, rows) {
    // Nothing to do for simulated terminal
  }
}

// Set up terminal routes
const setupTerminalRoutes = (app, wss) => {
  const router = express.Router();

  // Create a new terminal session
  router.post('/sessions', (req, res) => {
    const sessionId = uuidv4();
    const terminal = new SimulatedTerminal(sessionId);
    
    sessions.set(sessionId, terminal);
    
    console.log(`Created new terminal session: ${sessionId}`);
    res.status(201).json({ sessionId });
  });

  // Execute a command in a terminal session
  router.post('/execute', (req, res) => {
    const { command, sessionId } = req.body;
    
    if (!sessionId || !sessions.has(sessionId)) {
      return res.status(404).json({ error: 'Terminal session not found' });
    }
    
    const terminal = sessions.get(sessionId);
    
    try {
      // Set up a one-time data handler to capture output
      let output = '';
      const originalOnData = terminal.onData;
      
      terminal.onData = (data) => {
        output += data;
      };
      
      // Write the command
      terminal.write(command + '\r');
      
      // Wait a bit for the simulated command to complete
      setTimeout(() => {
        terminal.onData = originalOnData;
        res.json({ output });
      }, 100);
    } catch (error) {
      console.error('Error executing command:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Terminate a terminal session
  router.delete('/sessions/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    
    if (!sessions.has(sessionId)) {
      return res.status(404).json({ error: 'Terminal session not found' });
    }
    
    const terminal = sessions.get(sessionId);
    terminal.kill();
    sessions.delete(sessionId);
    
    console.log(`Terminated terminal session: ${sessionId}`);
    res.status(204).end();
  });

  // Set up WebSocket handlers for terminal
  wss.on('connection', (ws, req) => {
    // Handle WebSocket for terminal interaction
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = url.pathname.split('/').pop();
    
    if (sessionId && sessions.has(sessionId)) {
      console.log(`WebSocket connected for terminal session: ${sessionId}`);
      
      const terminal = sessions.get(sessionId);
      
      terminal.onData = (data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      };
      
      terminal.onExit = (code) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
      
      ws.on('message', (data) => {
        try {
          terminal.write(data);
        } catch (error) {
          console.error('Error processing terminal message:', error);
        }
      });
      
      ws.on('close', () => {
        console.log(`WebSocket closed for terminal session: ${sessionId}`);
      });
    } else {
      console.log(`WebSocket terminal session not found: ${sessionId}`);
      ws.close();
    }
  });

  app.use('/api/terminal', router);
};

module.exports = { setupTerminalRoutes };
```

## Shared Schema

```typescript

// shared/schema.ts
import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Define message types and roles
export const MessageRoleEnum = z.enum(["user", "assistant", "system"]);
export type MessageRole = z.infer<typeof MessageRoleEnum>;

// Define message part types (text, image, code)
export const MessagePartTypeEnum = z.enum(["text", "image", "code"]);
export type MessagePartType = z.infer<typeof MessagePartTypeEnum>;

// Define a schema for file metadata
export const FileMetadataSchema = z.object({
  filename: z.string(),
  mimeType: z.string(),
  size: z.number(),
  url: z.string().optional(),
});
export type FileMetadata = z.infer<typeof FileMetadataSchema>;

// Define a schema for message parts
export const MessagePartSchema = z.object({
  type: MessagePartTypeEnum,
  text: z.string().optional(),
  mimeType: z.string().optional(),
  fileName: z.string().optional(),
  fileData: z.string().optional(), // Base64 encoded file data
  language: z.string().optional(), // For code blocks
});
export type MessagePart = z.infer<typeof MessagePartSchema>;

// Define Conversation model
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  model: text("model").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  title: true,
  model: true,
});

// Define Message model
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  role: text("role").notNull(), // user, assistant, system
  content: jsonb("content").$type<MessagePart[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  role: true,
  content: true,
});

// Define Gemini models
export const GEMINI_MODELS = {
  // Gemini 2.5 models
  "gemini-2.5-pro-preview-03-25": {
    apiPath: "models/gemini-2.5-pro-preview-03-25",
    displayName: "Gemini 2.5 Pro (Preview)",
    description: "Enhanced thinking and reasoning"
  },
  
  // Gemini 2.0 models
  "gemini-2.0-flash": {
    apiPath: "models/gemini-2.0-flash",
    displayName: "Gemini 2.0 Flash",
    description: "Next generation features, speed, thinking"
  },
  "gemini-2.0-flash-lite": {
    apiPath: "models/gemini-2.0-flash-lite",
    displayName: "Gemini 2.0 Flash-Lite",
    description: "Cost efficiency and low latency"
  },
  
  // Gemini 1.5 models
  "gemini-1.5-flash": {
    apiPath: "models/gemini-1.5-flash",
    displayName: "Gemini 1.5 Flash",
    description: "Fast and versatile performance"
  },
  "gemini-1.5-flash-8b": {
    apiPath: "models/gemini-1.5-flash-8b",
    displayName: "Gemini 1.5 Flash-8B",
    description: "High volume and lower intelligence tasks"
  },
  "gemini-1.5-pro": {
    apiPath: "models/gemini-1.5-pro",
    displayName: "Gemini 1.5 Pro",
    description: "Complex reasoning tasks requiring more intelligence"
  },
  
  // Legacy models
  "gemini-pro": {
    apiPath: "models/gemini-pro",
    displayName: "Gemini 1.0 Pro",
    description: "Legacy model"
  },
  "gemini-1.0-pro": {
    apiPath: "models/gemini-pro",
    displayName: "Gemini 1.0 Pro (Legacy)",
    description: "Legacy name mapping"
  },

  // Embeddings
  "gemini-embedding-exp": {
    apiPath: "models/gemini-embedding-exp",
    displayName: "Gemini Embedding",
    description: "Text embeddings"
  },
};

// Default model ID
export const DEFAULT_MODEL_ID = "gemini-2.5-pro-preview-03-25";

// Helper type for model ID
export type GeminiModelId = keyof typeof GEMINI_MODELS;

// Define model parameters
export const ModelParametersSchema = z.object({
  temperature: z.number().min(0).max(1).default(0.7),
  maxOutputTokens: z.number().min(1).max(8192).default(2048),
  topK: z.number().min(1).max(40).default(40),
  topP: z.number().min(0).max(1).default(0.8),
  stream: z.boolean().default(true),
  systemInstructions: z.string().optional(),
});
export type ModelParameters = z.infer<typeof ModelParametersSchema>;

// Export type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
```

## Client Components


### App Component

```tsx

// client/src/App.tsx
import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/sidebar";
import ChatView from "@/components/chat-view";
import GenerateView from "@/components/generate-view";
import CodeView from "@/components/code-view";
import LiveApiView from "@/components/live-api-view";
import ConfigPanel from "@/components/config-panel";
import ErrorBoundary from "@/components/error-boundary";
import { ThemeProvider } from "@/contexts/theme-context";
import { GeminiProvider } from "@/contexts/gemini-context";
import { ConversationsProvider } from "@/contexts/conversations-context";

function MainLayout() {
  const [activeTab, setActiveTab] = useState<'chat' | 'generate' | 'code' | 'liveapi'>('chat');

  // Handle tab change events from sidebar
  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      setActiveTab(event.detail);
    };

    window.addEventListener('change-tab', handleTabChange as EventListener);
    
    return () => {
      window.removeEventListener('change-tab', handleTabChange as EventListener);
    };
  }, []);

  return (
    <div className="flex h-screen dark:dark">
      <ErrorBoundary>
        <Sidebar activeTab={activeTab} />
      </ErrorBoundary>
      
      <div className="flex-grow flex flex-col h-full overflow-hidden bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200">
        {/* Main Content with Split Panels */}
        <div className="flex-grow flex overflow-hidden">
          {/* Display the active tab content */}
          <div className="flex-grow flex flex-col overflow-hidden">
            <ErrorBoundary>
              {activeTab === 'chat' && <ChatView />}
              {activeTab === 'generate' && <GenerateView />}
              {activeTab === 'code' && <CodeView />}
              {activeTab === 'liveapi' && <LiveApiView />}
            </ErrorBoundary>
          </div>
          
          {/* Configuration Panel */}
          <ErrorBoundary>
            <ConfigPanel />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <GeminiProvider>
        <ConversationsProvider>
          <div className="font-roboto">
            <Switch>
              <Route path="/" component={MainLayout} />
              <Route component={NotFound} />
            </Switch>
            <Toaster />
          </div>
        </ConversationsProvider>
      </GeminiProvider>
    </ThemeProvider>
  );
}

export default App;
```

### Chat View Component

```tsx

// client/src/components/chat-view.tsx
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useGeminiContext } from '@/hooks/use-gemini-context';
import { useConversations } from '@/hooks/use-conversations';
import { apiRequest, queryClient } from '@/lib/queryClient';
import MessageInput from './message-input';
import CodeBlock from './ui/code-block';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useWebSocket } from '@/hooks/use-websocket';
import { ModelParameters } from '@shared/schema';

export default function ChatView() {
  const { modelConfig } = useGeminiContext();
  const { 
    selectedConversation,
    createConversation
  } = useConversations();
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const websocket = useWebSocket();
  
  // Keep track of pending text to avoid multiple submissions
  const pendingSubmissionRef = useRef<{text: string, files: File[]} | null>(null);
  
  // Extract selected model and parameters from modelConfig
  const selectedModel = modelConfig.model;
  const parameters: ModelParameters = {
    temperature: modelConfig.temperature,
    maxOutputTokens: modelConfig.maxOutputTokens,
    topP: modelConfig.topP,
    topK: modelConfig.topK,
    stream: true,
    systemInstructions: modelConfig.systemInstructions || undefined
  };
  
  // Query for messages in the current conversation
  const { 
    data: messages = [], 
    isLoading 
  } = useQuery({
    queryKey: ['/api/conversations', selectedConversation?.id, 'messages'],
    enabled: !!selectedConversation?.id,
  });
  
  // Mutation for adding a new message
  const addMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/conversations/' + (selectedConversation?.id || 0) + '/messages', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations', selectedConversation?.id, 'messages'] 
      });
    }
  });
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Set up WebSocket message handler
  useEffect(() => {
    if (!websocket.socket || websocket.status !== 'open') return;
    
    const handleWebSocketMessage = async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received:", data);
        
        if (data.type === 'chunk' && data.conversationId === selectedConversation?.id) {
          // Handle message chunk - force refetch all messages to get the updated content
          await queryClient.invalidateQueries({ 
            queryKey: ['/api/conversations', selectedConversation?.id, 'messages'] 
          });
          // Force a refetch to ensure we have the latest data
          await queryClient.refetchQueries({
            queryKey: ['/api/conversations', selectedConversation?.id, 'messages']
          });
        }
        else if (data.type === 'done') {
          console.log("Message generation complete");
          setIsGenerating(false);
          // Final refetch to get the complete message
          await queryClient.invalidateQueries({ 
            queryKey: ['/api/conversations', selectedConversation?.id, 'messages'] 
          });
        }
        else if (data.type === 'error') {
          console.error('WebSocket error:', data.error);
          setIsGenerating(false);
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
      }
    };
    
    websocket.socket.addEventListener('message', handleWebSocketMessage);
    
    return () => {
      if (websocket.socket) {
        websocket.socket.removeEventListener('message', handleWebSocketMessage);
      }
    };
  }, [websocket.socket, websocket.status, selectedConversation?.id, queryClient]);
  
  // Function to send message to Gemini API through REST endpoint
  const sendMessageToGemini = async (model: string, messages: any[], params: ModelParameters) => {
    const response = await apiRequest('/api/gemini/chat', 'POST', {
      model,
      messages,
      parameters: params
    });
    return response;
  };
  
  // Effect to send pending message when conversation is selected
  useEffect(() => {
    // If we have a selected conversation and a pending message, send it
    if (selectedConversation && pendingSubmissionRef.current) {
      console.log("Selected conversation updated, sending pending message", 
        selectedConversation.id, pendingSubmissionRef.current.text.substring(0, 30));
      
      const { text, files } = pendingSubmissionRef.current;
      pendingSubmissionRef.current = null; // Clear to prevent duplicate sends
      
      // Small delay to ensure state is fully updated
      setTimeout(() => {
        try {
          handleSubmit(text, files);
        } catch (error) {
          console.error("Error sending pending message:", error);
        }
      }, 300); // Increased delay to ensure state fully propagates
    }
  }, [selectedConversation]);
  
  // Handle message submission
  const handleSubmit = async (text: string, files: File[]) => {
    try {
      // Create new conversation if needed
      if (!selectedConversation) {
        const title = text.substring(0, 30) + (text.length > 30 ? '...' : '');
        console.log("Creating new conversation:", title);
        
        // Store the text and files for later use
        pendingSubmissionRef.current = { text, files };
        
        try {
          const newConversation = await createConversation(title);
          console.log("New conversation created:", newConversation);
        } catch (err) {
          console.error("Failed to create conversation:", err);
          pendingSubmissionRef.current = null; // Clear pending submission on error
          return;
        }
        // The effect for selectedConversation change will handle sending the message
        return;
      }
      
      console.log("Sending message to conversation:", selectedConversation.id);
      setIsGenerating(true);
      
      // Process image files
      const processedFiles = await Promise.all(
        files.map(async (file) => {
          if (file.type.startsWith('image/')) {
            return new Promise<{ type: 'image', mimeType: string, fileData: string }>((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                resolve({
                  type: 'image',
                  mimeType: file.type,
                  fileData: e.target?.result as string
                });
              };
              reader.readAsDataURL(file);
            });
          }
          return null;
        })
      );
      
      // Create user message content parts
      const userMessageParts = [
        { type: 'text' as const, text },
        ...processedFiles.filter(Boolean) as any[]
      ];
      
      // Save user message to the conversation
      await addMessageMutation.mutateAsync({
        role: 'user',
        content: userMessageParts
      });
      
      // Get all messages for context
      const updatedMessages = await queryClient.fetchQuery({
        queryKey: ['/api/conversations', selectedConversation.id, 'messages']
      }) as any[];
      
      // Send the message to Gemini via WebSocket for streaming
      if (websocket.socket && websocket.status === 'open' && parameters.stream) {
        console.log("Sending chat message via WebSocket:", selectedConversation.id);
        websocket.sendMessage(JSON.stringify({
          type: 'chat',
          stream: true,
          model: selectedModel,
          messages: updatedMessages.map((msg: any) => ({
            role: msg.role,
            content: msg.content
          })),
          parameters,
          conversationId: selectedConversation.id
        }));
        
        // Create empty assistant message to start streaming
        await addMessageMutation.mutateAsync({
          role: 'assistant',
          content: [{ type: 'text', text: '' }]
        });
      } else {
        // Non-streaming fallback
        try {
          const response = await sendMessageToGemini(
            selectedModel,
            updatedMessages.map((msg: any) => ({
              role: msg.role,
              content: msg.content
            })),
            parameters
          ) as any;
          
          if (response && response.candidates && response.candidates[0]?.content) {
            const assistantContent = response.candidates[0].content.parts.map((part: any) => {
              if (part.text) {
                return { type: 'text', text: part.text };
              }
              return null;
            }).filter(Boolean);
            
            await addMessageMutation.mutateAsync({
              role: 'assistant',
              content: assistantContent.length ? assistantContent : [{ type: 'text', text: 'No response generated.' }]
            });
          }
        } catch (err) {
          console.error('Error sending message:', err);
        } finally {
          setIsGenerating(false);
        }
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setIsGenerating(false);
    }
  };
  
  // Render message content with proper formatting
  const renderMessageContent = (content: any[]) => {
    return content.map((part, idx) => {
      if (part.type === 'text') {
        // Use markdown rendering with code block support
        return (
          <ReactMarkdown
            key={idx}
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                const code = String(children).replace(/\n$/, '');
                
                if ((props as any).inline) {
                  return <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded font-mono text-sm" {...props}>{children}</code>;
                }
                
                return <CodeBlock language={language} code={code} />;
              },
              pre({ children }) {
                return <>{children}</>;
              }
            }}
          >
            {part.text}
          </ReactMarkdown>
        );
      } else if (part.type === 'image' && part.fileData) {
        return (
          <div key={idx} className="my-2">
            <img 
              src={part.fileData} 
              alt={part.fileName || 'Uploaded image'} 
              className="max-w-full max-h-80 rounded-lg"
            />
          </div>
        );
      }
      return null;
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  const typedMessages = messages as any[];
  
  return (
    <>
      {/* Conversation Display Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-6" id="conversation-container">
        {/* System Message */}
        <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3 border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center mr-3">
              <span className="material-icons text-sm text-neutral-600 dark:text-neutral-400">settings</span>
            </div>
            <div className="flex-grow">
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 font-medium">System</div>
              <div className="text-sm">
                {parameters.systemInstructions || 
                  'You are PodPlay Assistant, a helpful AI built to assist with coding, content generation, and answering questions.'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Conversation Messages */}
        {typedMessages.map((message: any) => {
          const isUser = message.role === 'user';
          const isSystem = message.role === 'system';
          
          return (
            <div key={message.id} className="flex items-start">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                isUser ? 'bg-primary' : 
                isSystem ? 'bg-neutral-200 dark:bg-neutral-700' : 
                'bg-secondary'
              }`}>
                <span className={`material-icons text-sm ${
                  isUser || !isSystem ? 'text-white' : 'text-neutral-600 dark:text-neutral-400'
                }`}>
                  {isUser ? 'person' : isSystem ? 'settings' : 'smart_toy'}
                </span>
              </div>
              <div className="flex-grow">
                <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                  {isUser ? 'You' : isSystem ? 'System' : 'PodPlay Assistant'}
                </div>
                <div className="text-sm space-y-3">
                  {renderMessageContent(message.content)}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Loading indicator when generating */}
        {isGenerating && (
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center mr-3">
              <span className="material-icons text-sm text-white">smart_toy</span>
            </div>
            <div className="flex-grow">
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                PodPlay Assistant
              </div>
              <div className="flex space-x-1">
                <div className="h-2 w-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce"></div>
                <div className="h-2 w-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="h-2 w-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Empty state when no messages */}
        {typedMessages.length === 0 && !isGenerating && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="material-icons text-primary text-2xl">chat</span>
            </div>
            <h3 className="text-lg font-google-sans font-medium mb-2">Start a new conversation</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center max-w-md">
              Ask a question, request information, or start a dialogue with PodPlay Assistant.
            </p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <MessageInput onSubmit={handleSubmit} />
    </>
  );
}
```

### Code View Component

```tsx

// client/src/components/code-view.tsx
import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useGemini } from '@/hooks/use-gemini';
import { apiRequest } from '@/lib/queryClient';
import MessageInput from './message-input';
import CodeBlock from './ui/code-block';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useWebSocket } from '@/hooks/use-websocket';

export default function CodeView() {
  const { selectedModel, parameters, sendMessageToGemini } = useGemini();
  const [response, setResponse] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [userPrompt, setUserPrompt] = useState<string>('');
  const responseRef = useRef<HTMLDivElement>(null);
  const { socket, isConnected } = useWebSocket();
  
  // Update system instructions specifically for coding tasks
  useEffect(() => {
    const codeSystemInstructions = 
      "You are PodPlay Code Assistant, a specialized AI built to help with programming tasks. " +
      "Focus on providing high-quality, clean code examples with explanations. " +
      "When appropriate, use proper syntax highlighting and structure your responses with clear explanations.";
    
    if (parameters?.systemInstructions !== codeSystemInstructions) {
      // Don't update if user has custom instructions
      if (!parameters?.systemInstructions || (parameters?.systemInstructions && parameters.systemInstructions.includes("PodPlay Assistant"))) {
        return;
      }
    }
  }, [parameters?.systemInstructions]);
  
  // Set up WebSocket message handler
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    const handleWebSocketMessage = async (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'chunk' && data.content?.parts) {
        // Append text from each part
        const text = data.content.parts
          .filter((part: any) => part.text)
          .map((part: any) => part.text)
          .join('');
        
        setResponse(prev => prev + text);
      }
      else if (data.type === 'done') {
        setIsGenerating(false);
      }
      else if (data.type === 'error') {
        console.error('WebSocket error:', data.error);
        setIsGenerating(false);
        setResponse(prev => prev + `\n\nError: ${data.error}`);
      }
    };
    
    socket.addEventListener('message', handleWebSocketMessage);
    
    return () => {
      socket.removeEventListener('message', handleWebSocketMessage);
    };
  }, [socket, isConnected]);
  
  // Scroll to bottom when response changes
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [response]);
  
  // Handle message submission
  const handleSubmit = async (text: string, files: File[]) => {
    setIsGenerating(true);
    setUserPrompt(text);
    setResponse('');
    
    // Create message content
    const messageContent = [{ type: 'text', text }];
    
    // Send the message to Gemini via WebSocket for streaming
    if (socket && isConnected && parameters.stream) {
      // Add code-focused system instruction
      const codeParameters = {
        ...parameters,
        systemInstructions: parameters.systemInstructions || 
          "You are PodPlay Code Assistant, a specialized AI built to help with programming tasks. " +
          "Focus on providing high-quality, clean code examples with explanations."
      };
      
      socket.send(JSON.stringify({
        type: 'generate',
        stream: true,
        model: selectedModel,
        messages: [{ role: 'user', content: messageContent }],
        parameters: codeParameters
      }));
    } else {
      // Non-streaming fallback
      try {
        // Add code-focused system instruction
        const codeParameters = {
          ...parameters,
          systemInstructions: parameters.systemInstructions || 
            "You are PodPlay Code Assistant, a specialized AI built to help with programming tasks. " +
            "Focus on providing high-quality, clean code examples with explanations."
        };
        
        const response = await sendMessageToGemini(
          selectedModel,
          [{ role: 'user', content: messageContent }],
          codeParameters
        );
        
        if (response && response.candidates && response.candidates[0]?.content) {
          const text = response.candidates[0].content.parts
            .filter((part: any) => part.text)
            .map((part: any) => part.text)
            .join('');
          
          setResponse(text);
        }
      } catch (err: any) {
        setResponse(`Error: ${err.message || 'Failed to generate code'}`);
      } finally {
        setIsGenerating(false);
      }
    }
  };
  
  return (
    <>
      {/* Content Display Area */}
      <div className="flex-grow overflow-y-auto p-4">
        {/* User prompt */}
        {userPrompt && (
          <div className="mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-3">
                <span className="material-icons text-sm text-white">person</span>
              </div>
              <div className="flex-grow">
                <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 font-medium">You</div>
                <div className="text-sm">{userPrompt}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Response content */}
        {(response || isGenerating) && (
          <div className="mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center mr-3">
                <span className="material-icons text-sm text-white">smart_toy</span>
              </div>
              <div className="flex-grow">
                <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 font-medium">PodPlay Code Assistant</div>
                
                {/* Loading indicator */}
                {isGenerating && !response && (
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="h-2 w-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                )}
                
                {/* Rendered markdown response */}
                {response && (
                  <div className="text-sm space-y-3">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          const language = match ? match[1] : '';
                          const code = String(children).replace(/\n$/, '');
                          
                          if (inline) {
                            return <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded font-mono text-sm" {...props}>{children}</code>;
                          }
                          
                          return <CodeBlock language={language} code={code} />;
                        },
                        pre({ children }) {
                          return <>{children}</>;
                        }
                      }}
                    >
                      {response}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Empty state */}
        {!userPrompt && !response && !isGenerating && (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="material-icons text-primary text-2xl">code</span>
            </div>
            <h3 className="text-lg font-google-sans font-medium mb-2">Code Assistant</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center max-w-md">
              Get help with coding tasks, debugging, or learning new programming concepts. Ask for code examples or explanations.
            </p>
          </div>
        )}
        
        <div ref={responseRef} />
      </div>
      
      {/* Input Area */}
      <MessageInput onSubmit={handleSubmit} />
    </>
  );
}
```

### Config Panel Component

```tsx

// client/src/components/config-panel.tsx
import { useState } from 'react';
import { useGeminiContext } from '@/hooks/use-gemini-context';
import { useQuery } from '@tanstack/react-query';

interface ApiStatus {
  apiKeyConfigured?: boolean;
  apiKeyMasked?: string;
}

export default function ConfigPanel() {
  const { 
    modelConfig, 
    updateModelConfig, 
    availableModels 
  } = useGeminiContext();
  
  // Query API status
  const { data: apiStatus } = useQuery<ApiStatus>({
    queryKey: ['/api/status'],
    // No initialData to ensure it fetches from the server
  });
  
  const [showApiKey, setShowApiKey] = useState(false);
  
  return (
    <div className="w-72 border-l border-neutral-300 dark:border-neutral-700 flex flex-col bg-neutral-100 dark:bg-neutral-800 overflow-y-auto">
      <div className="p-4 border-b border-neutral-300 dark:border-neutral-700">
        <h2 className="font-google-sans font-medium">Configuration</h2>
      </div>
      
      <div className="flex-grow overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Temperature */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Temperature</label>
              <span className="text-sm">{modelConfig.temperature.toFixed(1)}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              value={modelConfig.temperature}
              onChange={(e) => updateModelConfig({ temperature: parseFloat(e.target.value) })}
              className="w-full h-2 bg-neutral-300 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              <span>Precise</span>
              <span>Balanced</span>
              <span>Creative</span>
            </div>
          </div>
          
          {/* Max Output Tokens */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Max Output Tokens</label>
              <span className="text-sm">{modelConfig.maxOutputTokens}</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="8192" 
              step="1" 
              value={modelConfig.maxOutputTokens}
              onChange={(e) => updateModelConfig({ maxOutputTokens: parseInt(e.target.value) })}
              className="w-full h-2 bg-neutral-300 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          {/* Top K */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Top K</label>
              <span className="text-sm">{modelConfig.topK}</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="40" 
              step="1" 
              value={modelConfig.topK}
              onChange={(e) => updateModelConfig({ topK: parseInt(e.target.value) })}
              className="w-full h-2 bg-neutral-300 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          {/* Top P */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Top P</label>
              <span className="text-sm">{modelConfig.topP.toFixed(2)}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={modelConfig.topP}
              onChange={(e) => updateModelConfig({ topP: parseFloat(e.target.value) })}
              className="w-full h-2 bg-neutral-300 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          {/* Other Options */}
          <div className="pt-2 border-t border-neutral-300 dark:border-neutral-700">
            <h3 className="text-sm font-medium mb-3">Advanced Options</h3>
            
            <div className="space-y-3">
              {/* Stream Response */}
              <div className="flex justify-between items-center">
                <label className="text-sm">Stream Response</label>
                <button 
                  className={`w-9 h-5 relative rounded-full ${modelConfig.stream ? 'bg-primary' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                  onClick={() => updateModelConfig({ stream: !modelConfig.stream })}
                >
                  <span 
                    className={`absolute h-4 w-4 ${
                      modelConfig.stream ? 'left-4' : 'left-0.5'
                    } top-0.5 rounded-full bg-white transition-all duration-200`}
                  ></span>
                </button>
              </div>
              
              {/* System Instructions */}
              <div>
                <label className="text-sm block mb-2">System Instructions</label>
                <textarea 
                  className="w-full border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 bg-white dark:bg-neutral-900 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary focus:border-transparent"
                  rows={3}
                  placeholder="Define how the assistant behaves..."
                  value={modelConfig.systemInstructions || ''}
                  onChange={(e) => updateModelConfig({ systemInstructions: e.target.value })}
                />
              </div>
              
              {/* Safety Settings */}
              <div>
                <label className="text-sm block mb-2">Safety Settings</label>
                <button className="w-full text-left border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 bg-white dark:bg-neutral-900 text-xs flex justify-between items-center">
                  <span>Manage safety settings</span>
                  <span className="material-icons text-xs">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* API Key Display */}
      <div className="p-4 border-t border-neutral-300 dark:border-neutral-700 mt-auto">
        <div className="text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium">API Key:</span>
            {apiStatus?.apiKeyConfigured ? (
              <span className="text-green-500 flex items-center">
                <span className="material-icons text-xs mr-1">check_circle</span>
                Configured
              </span>
            ) : (
              <span className="text-red-500 flex items-center">
                <span className="material-icons text-xs mr-1">error</span>
                Missing
              </span>
            )}
          </div>
          <div className="font-mono bg-white dark:bg-neutral-900 p-2 rounded text-xs border border-neutral-300 dark:border-neutral-700 flex justify-between items-center">
            <span>{apiStatus?.apiKeyMasked || 'GEMINI_API_KEY not set'}</span>
            <button 
              className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              <span className="material-icons text-xs">{showApiKey ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### WebSocket Hook

```tsx

// client/src/hooks/use-websocket.ts
```

### WebSocket Library

```tsx

// client/src/lib/websocket.ts
```

### Main Entry

```tsx

// client/src/main.tsx
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Create a wrapper with QueryClientProvider only, other providers are in App.tsx
function AppWithProviders() {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>
  );
}

// Use the wrapper for rendering
createRoot(document.getElementById("root")!).render(<AppWithProviders />);
```

### Conversations Context

```tsx

// client/src/contexts/conversations-context.tsx
```

### Conversations List Component

```tsx

// client/src/components/conversations-list.tsx
import { useQuery } from '@tanstack/react-query';
import { useConversationsContext } from '@/contexts/conversations-context';
import { Conversation } from '@shared/schema';

export default function ConversationsList() {
  const { 
    conversations, 
    isLoading, 
    selectedConversation, 
    selectConversation, 
    deleteConversation 
  } = useConversationsContext();
  
  // Cast conversations to the Conversation[] type
  const typedConversations = conversations as Conversation[];

  if (isLoading) {
    return (
      <div className="flex-grow p-4 flex flex-col items-center justify-center">
        <div className="animate-pulse flex space-x-2">
          <div className="h-2 w-2 bg-neutral-400 rounded-full"></div>
          <div className="h-2 w-2 bg-neutral-400 rounded-full"></div>
          <div className="h-2 w-2 bg-neutral-400 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (typedConversations.length === 0) {
    return (
      <div className="flex-grow p-4 flex flex-col items-center justify-center">
        <p className="text-sm text-neutral-500 text-center">
          No conversations yet.<br/>Start a new chat to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-grow overflow-y-auto">
      {typedConversations.map((conversation: Conversation) => {
        const isSelected = selectedConversation ? conversation.id === selectedConversation.id : false;
        const icon = conversation.title.toLowerCase().includes('code') ? 'code' : 
                    conversation.title.toLowerCase().includes('generate') ? 'text_fields' : 'chat';
        
        return (
          <div 
            key={conversation.id}
            className={`px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer flex items-center justify-between group ${
              isSelected ? 'bg-neutral-200 dark:bg-neutral-800' : ''
            }`}
            onClick={() => selectConversation(conversation.id)}
          >
            <div className="flex items-center overflow-hidden">
              <span className="material-icons text-neutral-500 mr-2 text-base">{icon}</span>
              <span className="text-sm truncate">{conversation.title}</span>
            </div>
            
            {/* Delete button - only visible on hover or selected */}
            <button
              className={`text-neutral-400 hover:text-error ${isSelected ? '' : 'opacity-0 group-hover:opacity-100'}`}
              onClick={(e) => {
                e.stopPropagation();
                deleteConversation(conversation.id);
              }}
            >
              <span className="material-icons text-sm">delete</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

### Query Client Setup

```tsx

// client/src/lib/queryClient.ts
```

### Error Boundary Component

```tsx

// client/src/components/error-boundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 h-full">
          <h2 className="text-lg font-medium mb-3">Something went wrong</h2>
          <div className="text-sm mb-4 max-w-md">
            {this.state.error?.message}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100 rounded-md hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;```

## Additional Configuration Files

```typescript

// package.json
{
  "name": "rest-express",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "dev": "tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.1",
    "@jridgewell/trace-mapping": "^0.3.25",
    "@neondatabase/serverless": "^0.10.4",
    "@radix-ui/react-accordion": "^1.2.1",
    "@radix-ui/react-alert-dialog": "^1.1.2",
    "@radix-ui/react-aspect-ratio": "^1.1.0",
    "@radix-ui/react-avatar": "^1.1.1",
    "@radix-ui/react-checkbox": "^1.1.2",
    "@radix-ui/react-collapsible": "^1.1.1",
    "@radix-ui/react-context-menu": "^2.2.2",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-hover-card": "^1.1.2",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-menubar": "^1.1.2",
    "@radix-ui/react-navigation-menu": "^1.2.1",
    "@radix-ui/react-popover": "^1.1.2",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-radio-group": "^1.2.1",
    "@radix-ui/react-scroll-area": "^1.2.0",
    "@radix-ui/react-select": "^2.1.2",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slider": "^1.2.1",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.1",
    "@radix-ui/react-tabs": "^1.1.1",
    "@radix-ui/react-toast": "^1.2.2",
    "@radix-ui/react-toggle": "^1.1.0",
    "@radix-ui/react-toggle-group": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.3",
    "@replit/vite-plugin-shadcn-theme-json": "^0.0.4",
    "@tanstack/react-query": "^5.60.5",
    "@types/multer": "^1.4.12",
    "@types/uuid": "^10.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.0",
    "connect-pg-simple": "^10.0.0",
    "date-fns": "^3.6.0",
    "drizzle-orm": "^0.39.1",
    "drizzle-zod": "^0.7.0",
    "embla-carousel-react": "^8.3.0",
    "express": "^4.21.2",
    "express-session": "^1.18.1",
    "framer-motion": "^11.13.1",
    "input-otp": "^1.2.4",
    "lucide-react": "^0.453.0",
    "memorystore": "^1.6.7",
    "multer": "^1.4.5-lts.2",
    "node-fetch": "^3.3.2",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.53.1",
    "react-icons": "^5.4.0",
    "react-markdown": "^10.1.0",
    "react-resizable-panels": "^2.1.4",
    "react-syntax-highlighter": "^15.6.1",
    "recharts": "^2.13.0",
    "remark-gfm": "^4.0.1",
    "sonner": "^2.0.3",
    "tailwind-merge": "^2.5.4",
    "tailwindcss-animate": "^1.0.7",
    "uuid": "^11.1.0",
    "vaul": "^1.1.0",
    "wouter": "^3.3.5",
    "ws": "^8.18.0",
    "zod": "^3.23.8",
    "zod-validation-error": "^3.4.0"
  },
  "devDependencies": {
    "@replit/vite-plugin-cartographer": "^0.0.11",
    "@replit/vite-plugin-runtime-error-modal": "^0.0.3",
    "@tailwindcss/typography": "^0.5.15",
    "@types/connect-pg-simple": "^7.0.3",
    "@types/express": "4.17.21",
    "@types/express-session": "^1.18.0",
    "@types/node": "20.16.11",
    "@types/passport": "^1.0.16",
    "@types/passport-local": "^1.0.38",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@types/ws": "^8.5.13",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "drizzle-kit": "^0.30.4",
    "esbuild": "^0.25.0",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "tsx": "^4.19.1",
    "typescript": "5.6.3",
    "vite": "^5.4.14"
  },
  "optionalDependencies": {
    "bufferutil": "^4.0.8"
  }
}
```
