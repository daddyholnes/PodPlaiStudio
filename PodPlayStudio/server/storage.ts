import { v4 as uuidv4 } from 'uuid';

// Interface definitions
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
  modelConfig?: ModelConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentItem {
  id: string;
  title: string;
  content: string;
  type: string;
  prompt?: string;
  modelConfig?: ModelConfig;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  config?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppSettings {
  apiKey?: string;
  theme?: string;
}

export interface ModelConfig {
  model: string;
  temperature?: number;
  maxOutputTokens?: number;
  topK?: number;
  topP?: number;
  stopSequences?: string[];
}

// Memory storage implementation
export interface IStorage {
  // Chat sessions
  getChatSessions(): Promise<ChatSession[]>;
  getChatSessionById(id: string): Promise<ChatSession | null>;
  createChatSession(data: Partial<ChatSession>): Promise<ChatSession>;
  updateChatSession(id: string, data: Partial<ChatSession>): Promise<ChatSession | null>;
  deleteChatSession(id: string): Promise<boolean>;
  
  // Chat messages
  getChatMessagesBySessionId(sessionId: string): Promise<ChatMessage[]>;
  createChatMessage(data: Partial<ChatMessage>): Promise<ChatMessage>;
  
  // Content items
  getContentItems(): Promise<ContentItem[]>;
  getContentItemById(id: string): Promise<ContentItem | null>;
  createContentItem(data: Partial<ContentItem>): Promise<ContentItem>;
  deleteContentItem(id: string): Promise<boolean>;
  
  // Projects
  getProjects(): Promise<Project[]>;
  getProjectById(id: string): Promise<Project | null>;
  createProject(data: Partial<Project>): Promise<Project>;
  updateProject(id: string, data: Partial<Project>): Promise<Project | null>;
  deleteProject(id: string): Promise<boolean>;
  
  // App settings
  getAppSettings(): Promise<AppSettings | null>;
  updateAppSettings(data: Partial<AppSettings>): Promise<AppSettings>;
}

class MemStorage implements IStorage {
  private chatSessions: ChatSession[] = [];
  private chatMessages: ChatMessage[] = [];
  private contentItems: ContentItem[] = [];
  private projects: Project[] = [];
  private appSettings: AppSettings = {};
  
  // Chat sessions
  async getChatSessions(): Promise<ChatSession[]> {
    return [...this.chatSessions].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  
  async getChatSessionById(id: string): Promise<ChatSession | null> {
    return this.chatSessions.find(session => session.id === id) || null;
  }
  
  async createChatSession(data: Partial<ChatSession>): Promise<ChatSession> {
    const now = new Date();
    const newSession: ChatSession = {
      id: data.id || uuidv4(),
      title: data.title || 'New Chat',
      modelConfig: data.modelConfig || {
        model: 'gemini-pro',
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    
    this.chatSessions.push(newSession);
    return newSession;
  }
  
  async updateChatSession(id: string, data: Partial<ChatSession>): Promise<ChatSession | null> {
    const sessionIndex = this.chatSessions.findIndex(session => session.id === id);
    
    if (sessionIndex === -1) {
      return null;
    }
    
    const updatedSession = {
      ...this.chatSessions[sessionIndex],
      ...data,
      updatedAt: new Date(),
    };
    
    this.chatSessions[sessionIndex] = updatedSession;
    return updatedSession;
  }
  
  async deleteChatSession(id: string): Promise<boolean> {
    const initialLength = this.chatSessions.length;
    this.chatSessions = this.chatSessions.filter(session => session.id !== id);
    
    // Also delete associated messages
    this.chatMessages = this.chatMessages.filter(message => message.sessionId !== id);
    
    return initialLength > this.chatSessions.length;
  }
  
  // Chat messages
  async getChatMessagesBySessionId(sessionId: string): Promise<ChatMessage[]> {
    return this.chatMessages
      .filter(message => message.sessionId === sessionId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
  
  async createChatMessage(data: Partial<ChatMessage>): Promise<ChatMessage> {
    if (!data.sessionId) {
      throw new Error('SessionId is required for chat messages');
    }
    
    const newMessage: ChatMessage = {
      id: data.id || uuidv4(),
      sessionId: data.sessionId,
      content: data.content || '',
      role: data.role || 'user',
      timestamp: data.timestamp || new Date(),
    };
    
    this.chatMessages.push(newMessage);
    
    // Update the corresponding chat session's updatedAt field
    const sessionIndex = this.chatSessions.findIndex(session => session.id === data.sessionId);
    if (sessionIndex !== -1) {
      this.chatSessions[sessionIndex].updatedAt = new Date();
    }
    
    return newMessage;
  }
  
  // Content items
  async getContentItems(): Promise<ContentItem[]> {
    return [...this.contentItems].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getContentItemById(id: string): Promise<ContentItem | null> {
    return this.contentItems.find(item => item.id === id) || null;
  }
  
  async createContentItem(data: Partial<ContentItem>): Promise<ContentItem> {
    if (!data.title || !data.content || !data.type) {
      throw new Error('Title, content, and type are required for content items');
    }
    
    const newItem: ContentItem = {
      id: data.id || uuidv4(),
      title: data.title,
      content: data.content,
      type: data.type,
      prompt: data.prompt,
      modelConfig: data.modelConfig,
      createdAt: data.createdAt || new Date(),
    };
    
    this.contentItems.push(newItem);
    return newItem;
  }
  
  async deleteContentItem(id: string): Promise<boolean> {
    const initialLength = this.contentItems.length;
    this.contentItems = this.contentItems.filter(item => item.id !== id);
    return initialLength > this.contentItems.length;
  }
  
  // Projects
  async getProjects(): Promise<Project[]> {
    return [...this.projects].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  
  async getProjectById(id: string): Promise<Project | null> {
    return this.projects.find(project => project.id === id) || null;
  }
  
  async createProject(data: Partial<Project>): Promise<Project> {
    if (!data.name) {
      throw new Error('Name is required for projects');
    }
    
    const now = new Date();
    const newProject: Project = {
      id: data.id || uuidv4(),
      name: data.name,
      description: data.description,
      config: data.config,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    
    this.projects.push(newProject);
    return newProject;
  }
  
  async updateProject(id: string, data: Partial<Project>): Promise<Project | null> {
    const projectIndex = this.projects.findIndex(project => project.id === id);
    
    if (projectIndex === -1) {
      return null;
    }
    
    const updatedProject = {
      ...this.projects[projectIndex],
      ...data,
      updatedAt: new Date(),
    };
    
    this.projects[projectIndex] = updatedProject;
    return updatedProject;
  }
  
  async deleteProject(id: string): Promise<boolean> {
    const initialLength = this.projects.length;
    this.projects = this.projects.filter(project => project.id !== id);
    return initialLength > this.projects.length;
  }
  
  // App settings
  async getAppSettings(): Promise<AppSettings | null> {
    return this.appSettings;
  }
  
  async updateAppSettings(data: Partial<AppSettings>): Promise<AppSettings> {
    this.appSettings = {
      ...this.appSettings,
      ...data,
    };
    
    return this.appSettings;
  }
}

// Create and export a singleton instance
const storage: IStorage = new MemStorage();
export default storage;