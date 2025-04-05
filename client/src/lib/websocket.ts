// Define the connection protocol based on the current environment
export const getWebSocketUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host || 'localhost:5000'; // Fallback to default port
  const wsUrl = `${protocol}//${host}/ws`;
  console.log('Connecting to WebSocket URL:', wsUrl);
  return wsUrl;
};

// WebSocket message types enum
export enum WebSocketMessageType {
  CHAT = 'chat',
  GENERATE = 'generate',
  CODE = 'code',
  CONFIG = 'config',
  LIVE_API = 'live_api',
  ERROR = 'error',
  MODELS = 'models',
  CONVERSATIONS = 'conversations',
  NEW_CONVERSATION = 'new_conversation',
  DELETE_CONVERSATION = 'delete_conversation',
  UPDATE_CONVERSATION = 'update_conversation'
}

// Base WebSocket message interface
export interface WebSocketMessage {
  type: WebSocketMessageType;
  id?: string;
  error?: string;
}

// Chat message
export interface ChatWebSocketMessage extends WebSocketMessage {
  type: WebSocketMessageType.CHAT;
  conversationId: number;
  content: string;
  files?: string[]; // Base64 encoded files
}

// Generate message
export interface GenerateWebSocketMessage extends WebSocketMessage {
  type: WebSocketMessageType.GENERATE;
  prompt: string;
  files?: string[]; // Base64 encoded files
}

// Code message
export interface CodeWebSocketMessage extends WebSocketMessage {
  type: WebSocketMessageType.CODE;
  prompt: string;
  files?: string[]; // Base64 encoded files
}

// Config message
export interface ConfigWebSocketMessage extends WebSocketMessage {
  type: WebSocketMessageType.CONFIG;
  model: string;
  temperature: number;
  maxOutputTokens: number;
  topK: number;
  topP: number;
}

// Live API message
export interface LiveApiWebSocketMessage extends WebSocketMessage {
  type: WebSocketMessageType.LIVE_API;
  start?: boolean;
  stop?: boolean;
  mode?: 'camera' | 'screen' | 'none';
  audio?: boolean;
}

// Create a simple message parser for WebSocket events
export const parseWebSocketMessage = (event: MessageEvent): WebSocketMessage => {
  try {
    const data = JSON.parse(event.data);
    return data as WebSocketMessage;
  } catch (error) {
    console.error('Error parsing WebSocket message:', error);
    return {
      type: WebSocketMessageType.ERROR,
      error: 'Failed to parse message'
    };
  }
};

// Serialize a message to send over WebSocket
export const serializeWebSocketMessage = (message: WebSocketMessage): string => {
  try {
    return JSON.stringify(message);
  } catch (error) {
    console.error('Error serializing WebSocket message:', error);
    return JSON.stringify({
      type: WebSocketMessageType.ERROR,
      error: 'Failed to serialize message'
    });
  }
};