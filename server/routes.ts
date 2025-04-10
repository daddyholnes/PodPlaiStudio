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
