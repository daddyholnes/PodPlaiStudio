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
