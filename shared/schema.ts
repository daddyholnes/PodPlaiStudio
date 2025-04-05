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
