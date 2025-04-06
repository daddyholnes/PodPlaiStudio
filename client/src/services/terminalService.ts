import { useWebSocket } from '@/hooks/use-websocket';
import { v4 as uuidv4 } from 'uuid';

export interface TerminalCommand {
  id: string;
  command: string;
  timestamp: number;
}

export interface TerminalOutput {
  id: string;
  commandId: string;
  text: string;
  isError: boolean;
  timestamp: number;
}

export interface TerminalSession {
  id: string;
  title: string;
  history: TerminalCommand[];
  output: TerminalOutput[];
  cwd: string;
}

export class TerminalService {
  private static instance: TerminalService;
  private ws: ReturnType<typeof useWebSocket>;
  private sessions: Map<string, TerminalSession> = new Map();
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(websocket: ReturnType<typeof useWebSocket>) {
    this.ws = websocket;
    
    // Set up event listeners
    this.ws.addMessageListener('terminal:output', this.handleTerminalOutput.bind(this));
    this.ws.addMessageListener('terminal:error', this.handleTerminalError.bind(this));
    this.ws.addMessageListener('terminal:exit', this.handleTerminalExit.bind(this));
    
    // Load history from localStorage
    this.loadHistoryFromStorage();
  }

  public static getInstance(websocket: ReturnType<typeof useWebSocket>): TerminalService {
    if (!TerminalService.instance) {
      TerminalService.instance = new TerminalService(websocket);
    }
    return TerminalService.instance;
  }
  
  public createSession(title: string = 'Terminal'): TerminalSession {
    const id = uuidv4();
    const session: TerminalSession = {
      id,
      title,
      history: [],
      output: [],
      cwd: '~'
    };
    
    this.sessions.set(id, session);
    this.notifyListeners('sessions', Array.from(this.sessions.values()));
    
    // Initialize terminal session on the server
    this.ws.send('terminal:create', { sessionId: id });
    
    return session;
  }
  
  public closeSession(sessionId: string): void {
    if (this.sessions.has(sessionId)) {
      this.sessions.delete(sessionId);
      this.notifyListeners('sessions', Array.from(this.sessions.values()));
      
      // Close session on the server
      this.ws.send('terminal:close', { sessionId });
    }
  }
  
  public executeCommand(sessionId: string, command: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    const commandObj: TerminalCommand = {
      id: uuidv4(),
      command,
      timestamp: Date.now()
    };
    
    // Add to history
    session.history.push(commandObj);
    if (session.history.length > 100) {
      session.history.shift();
    }
    
    // Save to localStorage
    this.saveHistoryToStorage();
    
    // Add command to output for display
    const commandOutput: TerminalOutput = {
      id: uuidv4(),
      commandId: commandObj.id,
      text: `${session.cwd} $ ${command}`,
      isError: false,
      timestamp: Date.now()
    };
    session.output.push(commandOutput);
    
    // Notify listeners of the update
    this.notifyListeners(`session:${sessionId}`, session);
    
    // Send command to server
    this.ws.send('terminal:execute', {
      sessionId,
      commandId: commandObj.id,
      command
    });
  }
  
  private handleTerminalOutput(data: any): void {
    const { sessionId, commandId, text } = data;
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    const outputObj: TerminalOutput = {
      id: uuidv4(),
      commandId,
      text,
      isError: false,
      timestamp: Date.now()
    };
    
    session.output.push(outputObj);
    
    // Update working directory if it's a cd command
    if (text.includes('Directory changed to:')) {
      const match = text.match(/Directory changed to: (.+)/);
      if (match && match[1]) {
        session.cwd = match[1];
      }
    }
    
    this.notifyListeners(`session:${sessionId}`, session);
  }
  
  private handleTerminalError(data: any): void {
    const { sessionId, commandId, text } = data;
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    const errorObj: TerminalOutput = {
      id: uuidv4(),
      commandId,
      text,
      isError: true,
      timestamp: Date.now()
    };
    
    session.output.push(errorObj);
    this.notifyListeners(`session:${sessionId}`, session);
  }
  
  private handleTerminalExit(data: any): void {
    const { sessionId, commandId, code } = data;
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    if (code !== 0) {
      const exitMsg: TerminalOutput = {
        id: uuidv4(),
        commandId,
        text: `Process exited with code ${code}`,
        isError: true,
        timestamp: Date.now()
      };
      session.output.push(exitMsg);
    }
    
    this.notifyListeners(`session:${sessionId}`, session);
  }
  
  public getCommandSuggestions(command: string): string[] {
    // Common commands for auto-completion
    const commonCommands = [
      'cd', 'ls', 'mkdir', 'rm', 'cp', 'mv', 'cat', 'grep', 'find',
      'git clone', 'git commit', 'git push', 'git pull', 'git status',
      'npm install', 'npm start', 'npm run', 'npm test',
      'yarn add', 'yarn start', 'yarn build',
      'python', 'node', 'docker'
    ];
    
    if (!command) return [];
    return commonCommands.filter(cmd => cmd.startsWith(command));
  }
  
  private loadHistoryFromStorage(): void {
    try {
      const history = localStorage.getItem('terminal_history');
      if (history) {
        const historyData = JSON.parse(history);
        // Restore sessions from saved history
        for (const [id, session] of Object.entries(historyData)) {
          this.sessions.set(id, session as TerminalSession);
        }
      }
    } catch (error) {
      console.error('Failed to load terminal history:', error);
    }
  }
  
  private saveHistoryToStorage(): void {
    try {
      const historyData: Record<string, TerminalSession> = {};
      for (const [id, session] of this.sessions.entries()) {
        historyData[id] = {
          ...session,
          // Only save the last 50 outputs for storage efficiency
          output: session.output.slice(-50)
        };
      }
      localStorage.setItem('terminal_history', JSON.stringify(historyData));
    } catch (error) {
      console.error('Failed to save terminal history:', error);
    }
  }
  
  public getSessions(): TerminalSession[] {
    return Array.from(this.sessions.values());
  }
  
  public getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }
  
  public clearOutput(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.output = [];
      this.notifyListeners(`session:${sessionId}`, session);
    }
  }
  
  public addEventListener(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    const eventListeners = this.listeners.get(event)!;
    eventListeners.add(callback);
    
    return () => {
      eventListeners.delete(callback);
    };
  }
  
  private notifyListeners(event: string, data: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }
}
