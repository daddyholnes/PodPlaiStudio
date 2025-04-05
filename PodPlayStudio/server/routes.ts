import express from 'express';
import storage from './storage';
import * as gemini from './api/gemini';
import { validateConfig, GEMINI_API_KEY } from './config';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { WebSocketServer } from 'ws';
import http from 'http';

// Set up upload middleware
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueFilename = `${uuidv4()}-${file.originalname}`;
      cb(null, uniqueFilename);
    }
  }),
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  }
});

const router = express.Router();

// API Status
router.get('/api/status', async (req, res) => {
  try {
    const config = validateConfig();
    const settings = await storage.getAppSettings();
    
    res.json({
      apiKeyConfigured: (!!settings?.apiKey || !!GEMINI_API_KEY),
      apiKey: settings?.apiKey ? '********' : null,
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Error fetching API status:', error);
    res.status(500).json({ error: 'Failed to get API status' });
  }
});

// Settings endpoints
router.get('/api/settings', async (req, res) => {
  try {
    const settings = await storage.getAppSettings();
    
    // Mask API key
    if (settings && settings.apiKey) {
      settings.apiKey = '********';
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

router.post('/api/settings', async (req, res) => {
  try {
    const { apiKey, theme } = req.body;
    
    // Update settings
    const updatedSettings = await storage.updateAppSettings({
      apiKey,
      theme
    });
    
    // Mask API key in response
    if (updatedSettings && updatedSettings.apiKey) {
      updatedSettings.apiKey = '********';
    }
    
    res.json(updatedSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Chat endpoints
router.get('/api/chat/sessions', async (req, res) => {
  try {
    const sessions = await storage.getChatSessions();
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({ error: 'Failed to fetch chat sessions' });
  }
});

router.get('/api/chat/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const session = await storage.getChatSessionById(id);
    
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Error fetching chat session:', error);
    res.status(500).json({ error: 'Failed to fetch chat session' });
  }
});

router.post('/api/chat/sessions', async (req, res) => {
  try {
    const { title, modelConfig } = req.body;
    
    const session = await storage.createChatSession({
      title,
      modelConfig
    });
    
    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating chat session:', error);
    res.status(500).json({ error: 'Failed to create chat session' });
  }
});

router.delete('/api/chat/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await storage.deleteChatSession(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting chat session:', error);
    res.status(500).json({ error: 'Failed to delete chat session' });
  }
});

router.get('/api/chat/sessions/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await storage.getChatMessagesBySessionId(id);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

router.post('/api/chat/sessions/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, role = 'user' } = req.body;
    
    // First, check if the session exists
    const session = await storage.getChatSessionById(id);
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    
    // Create user message
    const userMessage = await storage.createChatMessage({
      sessionId: id,
      content,
      role,
      timestamp: new Date(),
    });
    
    // If the role is "user", generate a response
    if (role === 'user') {
      try {
        // Get all previous messages for context
        const allMessages = await storage.getChatMessagesBySessionId(id);
        
        // Format messages for the AI model (excluding the very latest user message)
        const messageHistory = allMessages
          .filter(m => m.id !== userMessage.id)
          .map(msg => ({ role: msg.role, content: msg.content }));
        
        // Add the latest user message
        messageHistory.push({ role: 'user', content });
        
        // Build the prompt with conversation history
        const combinedPrompt = messageHistory
          .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
          .join('\n\n');
        
        const systemPrompt = 'You are a helpful AI assistant.';
        const fullPrompt = `${systemPrompt}\n\nConversation history:\n${combinedPrompt}\n\nAssistant: `;
        
        // Call the Gemini API
        const apiResponse = await gemini.generateText(fullPrompt, session.modelConfig);
        const responseText = gemini.extractTextFromResponse(apiResponse);
        
        // Create AI message
        const aiMessage = await storage.createChatMessage({
          sessionId: id,
          content: responseText,
          role: 'assistant',
          timestamp: new Date(),
        });
        
        res.status(201).json([userMessage, aiMessage]);
      } catch (error) {
        console.error('Error generating AI response:', error);
        
        // Still return the user message even if AI response fails
        res.status(201).json([userMessage]);
      }
    } else {
      // If not a user message, just return it
      res.status(201).json([userMessage]);
    }
  } catch (error) {
    console.error('Error adding chat message:', error);
    res.status(500).json({ error: 'Failed to add chat message' });
  }
});

// Generate endpoints
router.post('/api/generate', async (req, res) => {
  try {
    const { prompt, modelConfig, stream = false } = req.body;
    
    if (stream) {
      // Set up for streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const sendEvent = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };
      
      // Start generation with streaming
      const response = await gemini.generateText(prompt, modelConfig, true);
      
      gemini.processStreamResponse(
        response,
        (chunk) => sendEvent({ chunk }),
        () => {
          sendEvent({ done: true });
          res.end();
        },
        (error) => {
          console.error('Stream error:', error);
          sendEvent({ error: error.message });
          res.end();
        }
      );
    } else {
      // Regular non-streaming response
      const response = await gemini.generateText(prompt, modelConfig);
      res.json(response);
    }
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

router.post('/api/generate/multimodal', upload.array('images', 5), async (req, res) => {
  try {
    const { prompt, modelConfig, stream = false } = req.body;
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }
    
    const filePaths = files.map(file => file.path);
    
    if (stream) {
      // Set up for streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const sendEvent = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };
      
      // Start generation with streaming
      const response = await gemini.generateTextWithImage(prompt, filePaths, modelConfig, true);
      
      gemini.processStreamResponse(
        response,
        (chunk) => sendEvent({ chunk }),
        () => {
          sendEvent({ done: true });
          res.end();
          
          // Clean up uploaded files
          filePaths.forEach(filePath => {
            fs.unlink(filePath, () => {});
          });
        },
        (error) => {
          console.error('Stream error:', error);
          sendEvent({ error: error.message });
          res.end();
          
          // Clean up uploaded files
          filePaths.forEach(filePath => {
            fs.unlink(filePath, () => {});
          });
        }
      );
    } else {
      // Regular non-streaming response
      const response = await gemini.generateTextWithImage(prompt, filePaths, modelConfig);
      
      // Clean up uploaded files
      filePaths.forEach(filePath => {
        fs.unlink(filePath, () => {});
      });
      
      res.json(response);
    }
  } catch (error) {
    console.error('Error generating content with images:', error);
    res.status(500).json({ error: 'Failed to generate content with images' });
  }
});

// Content items endpoints
router.get('/api/content', async (req, res) => {
  try {
    const items = await storage.getContentItems();
    res.json(items);
  } catch (error) {
    console.error('Error fetching content items:', error);
    res.status(500).json({ error: 'Failed to fetch content items' });
  }
});

router.post('/api/content', async (req, res) => {
  try {
    const { title, content, type, prompt, modelConfig } = req.body;
    
    const item = await storage.createContentItem({
      title,
      content,
      type,
      prompt,
      modelConfig,
      createdAt: new Date(),
    });
    
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating content item:', error);
    res.status(500).json({ error: 'Failed to create content item' });
  }
});

// Projects endpoints
router.get('/api/projects', async (req, res) => {
  try {
    const projects = await storage.getProjects();
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.post('/api/projects', async (req, res) => {
  try {
    const { name, description, config } = req.body;
    
    const project = await storage.createProject({
      name,
      description,
      config,
    });
    
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.get('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await storage.getProjectById(id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Setup WebSocketServer
export function setupWebSocketServer(server: http.Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket connected');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'liveapi') {
          // Handle Live API interactions
          const { prompt, config } = data;
          
          if (!prompt) {
            ws.send(JSON.stringify({ error: 'No prompt provided' }));
            return;
          }
          
          try {
            // Generate response using Gemini API
            const response = await gemini.generateText(prompt, {
              model: config?.model || 'gemini-pro',
              temperature: config?.temperature || 0.7,
              maxOutputTokens: config?.maxOutputTokens || 1024,
              streamResponse: false,
            });
            
            const text = gemini.extractTextFromResponse(response);
            
            // Send response back to client
            ws.send(JSON.stringify({
              type: 'response',
              text,
              timestamp: new Date().toISOString()
            }));
          } catch (error) {
            console.error('Error in Live API:', error);
            if (error instanceof Error) {
              ws.send(JSON.stringify({ error: error.message }));
            } else {
              ws.send(JSON.stringify({ error: 'Unknown error occurred' }));
            }
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket disconnected');
    });
    
    // Send initial connection acknowledgment
    ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));
  });
  
  return wss;
}

export default router;