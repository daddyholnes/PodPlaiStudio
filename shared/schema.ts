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
