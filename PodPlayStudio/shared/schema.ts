import { z } from 'zod';

// Types for model configuration
export type ModelType = string;

export interface ModelConfig {
  model: ModelType;
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  apiType?: 'gemini' | 'vertex' | 'openai';
  streamResponse?: boolean;
}

// Chat Messages and Sessions
export interface ChatMessage {
  id: string;
  sessionId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  modelConfig: ModelConfig;
}

export const insertChatSessionSchema = z.object({
  title: z.string(),
  modelConfig: z.object({
    model: z.string(),
    temperature: z.number().optional(),
    topK: z.number().optional(),
    topP: z.number().optional(),
    maxOutputTokens: z.number().optional(),
    apiType: z.enum(['gemini', 'vertex', 'openai']).optional(),
    streamResponse: z.boolean().optional(),
  }),
});
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;

export const insertChatMessageSchema = z.object({
  sessionId: z.string(),
  content: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  timestamp: z.date().optional(),
});
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// App Settings
export interface AppSettings {
  id: string;
  theme: 'light' | 'dark' | 'system';
  apiKey?: string;
}

export const insertAppSettingsSchema = z.object({
  id: z.string().default('default'),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  apiKey: z.string().optional(),
});
export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;

// Project Configuration
export interface ProjectConfig {
  template?: string;
  apiUsage?: {
    model: ModelType;
    totalTokens: number;
    lastUsed: string;
  };
  deploymentInfo?: {
    url?: string;
    lastDeployed?: string;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  config: ProjectConfig;
}

export const insertProjectSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  config: z.object({
    template: z.string().optional(),
    apiUsage: z.object({
      model: z.string(),
      totalTokens: z.number(),
      lastUsed: z.string(),
    }).optional(),
    deploymentInfo: z.object({
      url: z.string().optional(),
      lastDeployed: z.string().optional(),
    }).optional(),
  }),
});
export type InsertProject = z.infer<typeof insertProjectSchema>;

// Content Items
export interface ContentItem {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'image' | 'code';
  prompt?: string;
  modelConfig?: ModelConfig;
  createdAt: Date;
}

export const insertContentItemSchema = z.object({
  title: z.string(),
  content: z.string(),
  type: z.enum(['text', 'image', 'code']),
  prompt: z.string().optional(),
  modelConfig: z.object({
    model: z.string(),
    temperature: z.number().optional(),
    topK: z.number().optional(),
    topP: z.number().optional(),
    maxOutputTokens: z.number().optional(),
    apiType: z.enum(['gemini', 'vertex', 'openai']).optional(),
    streamResponse: z.boolean().optional(),
  }).optional(),
  createdAt: z.date().optional(),
});
export type InsertContentItem = z.infer<typeof insertContentItemSchema>;

// Live API
export interface LiveApiConfig {
  model: ModelType;
  useCamera: boolean;
  useScreen: boolean;
  useMicrophone: boolean;
  responseFormat: 'text' | 'audio';
  streamResponse: boolean;
}

export interface LiveApiSession {
  id: string;
  title: string;
  createdAt: Date;
  config: LiveApiConfig;
  lastInteraction?: Date;
}

export const insertLiveApiSessionSchema = z.object({
  title: z.string(),
  config: z.object({
    model: z.string(),
    useCamera: z.boolean(),
    useScreen: z.boolean(),
    useMicrophone: z.boolean(),
    responseFormat: z.enum(['text', 'audio']),
    streamResponse: z.boolean(),
  }),
  createdAt: z.date().optional(),
});
export type InsertLiveApiSession = z.infer<typeof insertLiveApiSessionSchema>;