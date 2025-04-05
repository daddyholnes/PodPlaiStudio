import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';

// Model Config Schema
export const ModelConfigSchema = z.object({
  model: z.string(),
  temperature: z.number().min(0).max(1).optional(),
  maxOutputTokens: z.number().positive().optional(),
  topK: z.number().positive().optional(),
  topP: z.number().min(0).max(1).optional(),
  stopSequences: z.array(z.string()).optional(),
  streamResponse: z.boolean().optional()
});

export type ModelConfig = z.infer<typeof ModelConfigSchema>;

// Chat Message Schema
export const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  content: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  timestamp: z.date()
});

export const ChatMessageInsertSchema = createInsertSchema(ChatMessageSchema).omit({ id: true });
export type ChatMessageInsert = z.infer<typeof ChatMessageInsertSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// Chat Session Schema
export const ChatSessionSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  modelConfig: ModelConfigSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const ChatSessionInsertSchema = createInsertSchema(ChatSessionSchema).omit({ id: true });
export type ChatSessionInsert = z.infer<typeof ChatSessionInsertSchema>;
export type ChatSession = z.infer<typeof ChatSessionSchema>;

// Content Item Schema
export const ContentItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  type: z.string(),
  prompt: z.string().optional(),
  modelConfig: ModelConfigSchema.optional(),
  createdAt: z.date()
});

export const ContentItemInsertSchema = createInsertSchema(ContentItemSchema).omit({ id: true });
export type ContentItemInsert = z.infer<typeof ContentItemInsertSchema>;
export type ContentItem = z.infer<typeof ContentItemSchema>;

// Project Schema
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  config: z.any().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const ProjectInsertSchema = createInsertSchema(ProjectSchema).omit({ id: true });
export type ProjectInsert = z.infer<typeof ProjectInsertSchema>;
export type Project = z.infer<typeof ProjectSchema>;

// App Settings Schema
export const AppSettingsSchema = z.object({
  apiKey: z.string().optional(),
  theme: z.string().optional()
});

export type AppSettings = z.infer<typeof AppSettingsSchema>;