import { useState, useEffect, useRef } from 'react';
import { useApiStatus } from '@/hooks/use-api-status';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Send, Settings, RotateCcw, Plus, Save, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Link } from 'wouter';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface ModelConfig {
  model: string;
  temperature: number;
  maxOutputTokens?: number;
  topK?: number;
  topP?: number;
  stopSequences?: string[];
  streamResponse: boolean;
}

export default function ChatPage() {
  const { isApiConfigured, isLoading: isApiStatusLoading } = useApiStatus();
  const { success, error } = useToast();
  
  // WebSocket connection
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Chat states
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  
  // Model configuration
  const [showConfig, setShowConfig] = useState(false);
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    model: 'gemini-1.5-pro-latest',
    temperature: 0.7,
    maxOutputTokens: 1024,
    topK: 40,
    topP: 0.95,
    streamResponse: true
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Connect to WebSocket
  useEffect(() => {
    if (!isApiConfigured && !isApiStatusLoading) return;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('Connecting to WebSocket URL:', wsUrl);
    
    const newSocket = new WebSocket(wsUrl);
    
    newSocket.addEventListener('open', () => {
      setIsConnected(true);
      console.log('WebSocket connection established');
    });
    
    newSocket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'chat-response') {
          if (data.content) {
            setMessages(prev => {
              // Find the last message from the assistant
              const lastAssistantIndex = [...prev].reverse().findIndex(m => m.role === 'assistant');
              
              if (lastAssistantIndex === -1 || !data.streaming) {
                // If no assistant message found or not streaming, add a new message
                return [...prev, {
                  id: data.id || `msg-${Date.now()}`,
                  role: 'assistant',
                  content: data.content,
                  timestamp: new Date()
                }];
              } else {
                // If streaming, update the last assistant message
                const actualIndex = prev.length - 1 - lastAssistantIndex;
                const updated = [...prev];
                updated[actualIndex] = {
                  ...updated[actualIndex],
                  content: data.streaming ? updated[actualIndex].content + data.content : data.content
                };
                return updated;
              }
            });
          }
          
          if (data.done) {
            setIsProcessing(false);
          }
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    });
    
    newSocket.addEventListener('close', () => {
      setIsConnected(false);
      console.log('WebSocket connection closed');
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (socket?.readyState === WebSocket.CLOSED) {
          setSocket(null);
        }
      }, 3000);
    });
    
    newSocket.addEventListener('error', (err) => {
      console.error('WebSocket error:', err);
      error('WebSocket connection error');
    });
    
    setSocket(newSocket);
    
    return () => {
      if (newSocket.readyState === WebSocket.OPEN || newSocket.readyState === WebSocket.CONNECTING) {
        newSocket.close();
      }
    };
  }, [isApiConfigured, isApiStatusLoading]);
  
  // Load chat sessions
  useEffect(() => {
    if (!isApiConfigured) return;
    
    const loadSessions = async () => {
      try {
        const sessions = await apiRequest('/api/chat/sessions', 'GET');
        setChatSessions(sessions);
        
        if (sessions.length > 0 && !currentSessionId) {
          // Load the most recent session
          const mostRecent = sessions[0];
          setCurrentSessionId(mostRecent.id);
          setMessages(mostRecent.messages);
        }
      } catch (err) {
        console.error('Error loading chat sessions:', err);
        error('Failed to load chat sessions');
      }
    };
    
    loadSessions();
  }, [isApiConfigured, currentSessionId]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Create a new chat session
  const createNewSession = async () => {
    try {
      const newSession = await apiRequest('/api/chat/sessions', 'POST', { 
        title: 'New Chat',
        modelConfig
      });
      
      setChatSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
      success('New chat created');
    } catch (err) {
      console.error('Error creating new chat session:', err);
      error('Failed to create new chat');
    }
  };
  
  // Load a specific chat session
  const loadSession = async (sessionId: string) => {
    try {
      const session = await apiRequest(`/api/chat/sessions/${sessionId}`, 'GET');
      setMessages(session.messages);
      setCurrentSessionId(sessionId);
      setShowSessions(false);
    } catch (err) {
      console.error('Error loading chat session:', err);
      error('Failed to load chat');
    }
  };
  
  // Send a chat message
  const sendMessage = async () => {
    if (!inputMessage.trim() || isProcessing || !isConnected) return;
    
    try {
      setIsProcessing(true);
      
      // Add user message to the UI
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: inputMessage,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputMessage('');
      
      // Focus the input field after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
      
      if (!currentSessionId) {
        // Create a new session if there isn't one
        const newSession = await apiRequest('/api/chat/sessions', 'POST', { 
          title: inputMessage.substring(0, 30) + (inputMessage.length > 30 ? '...' : ''),
          modelConfig
        });
        
        setChatSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
      }
      
      // Send message via WebSocket if connected
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'chat-request',
          sessionId: currentSessionId,
          message: inputMessage,
          modelConfig
        }));
      } else {
        // Fallback to HTTP request if WebSocket is not connected
        const response = await apiRequest('/api/chat/message', 'POST', {
          sessionId: currentSessionId,
          message: inputMessage,
          modelConfig
        });
        
        // Add assistant response to UI
        setMessages(prev => [...prev, {
          id: response.id,
          role: 'assistant',
          content: response.content,
          timestamp: new Date()
        }]);
        
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      error('Failed to send message');
      setIsProcessing(false);
    }
  };
  
  // Update model configuration
  const updateModelConfig = (key: string, value: any) => {
    setModelConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Handle input key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // Clear current chat
  const clearChat = () => {
    setMessages([]);
  };
  
  // Resize the input field as the user types
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };
  
  // If API is not configured, show a prompt to configure it
  if (!isApiConfigured && !isApiStatusLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-16rem)] text-center px-4">
        <h2 className="text-xl font-semibold mb-4">API Key Required</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          To use the Chat feature, you need to configure your Gemini API key in the settings.
        </p>
        <Link href="/settings">
          <a className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            <Settings size={16} />
            <span>Go to Settings</span>
          </a>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="border-b py-2 px-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSessions(!showSessions)}
            className="p-2 rounded-md hover:bg-muted"
            aria-label="Toggle sessions"
          >
            {showSessions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          <h1 className="text-xl font-semibold">
            {chatSessions.find(s => s.id === currentSessionId)?.title || 'New Chat'}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="p-2 rounded-md hover:bg-muted"
            title="Clear chat"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={createNewSession}
            className="p-2 rounded-md hover:bg-muted"
            title="New chat"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 rounded-md hover:bg-muted"
            title="Model settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
      
      {/* Sessions sidebar (collapsible) */}
      {showSessions && (
        <div className="p-4 border-b bg-muted/50">
          <h2 className="text-sm font-medium mb-3">Chat History</h2>
          <div className="max-h-40 overflow-y-auto">
            {chatSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No chat history</p>
            ) : (
              <ul className="space-y-1">
                {chatSessions.map(session => (
                  <li key={session.id}>
                    <button
                      onClick={() => loadSession(session.id)}
                      className={`w-full text-left p-2 rounded-md text-sm hover:bg-muted ${
                        currentSessionId === session.id ? 'bg-muted font-medium' : ''
                      }`}
                    >
                      {session.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      
      {/* Model configuration (collapsible) */}
      {showConfig && (
        <div className="p-4 border-b bg-muted/50">
          <h2 className="text-sm font-medium mb-3">Model Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="model" className="block text-sm font-medium mb-1">
                Model
              </label>
              <select
                id="model"
                value={modelConfig.model}
                onChange={(e) => updateModelConfig('model', e.target.value)}
                className="w-full p-2 rounded-md border bg-background"
              >
                <option value="gemini-1.5-pro-latest">Gemini 1.5 Pro</option>
                <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash</option>
                <option value="gemini-1.0-pro">Gemini 1.0 Pro</option>
                <option value="gemini-1.0-pro-vision">Gemini 1.0 Pro Vision</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="temperature" className="block text-sm font-medium mb-1">
                Temperature: {modelConfig.temperature}
              </label>
              <input
                id="temperature"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={modelConfig.temperature}
                onChange={(e) => updateModelConfig('temperature', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label htmlFor="maxTokens" className="block text-sm font-medium mb-1">
                Max Output Tokens
              </label>
              <input
                id="maxTokens"
                type="number"
                value={modelConfig.maxOutputTokens}
                onChange={(e) => updateModelConfig('maxOutputTokens', parseInt(e.target.value) || 1024)}
                className="w-full p-2 rounded-md border bg-background"
              />
            </div>
            
            <div>
              <label htmlFor="streamResponse" className="flex items-center mb-1">
                <input
                  id="streamResponse"
                  type="checkbox"
                  checked={modelConfig.streamResponse}
                  onChange={(e) => updateModelConfig('streamResponse', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Stream Response</span>
              </label>
              <p className="text-xs text-muted-foreground">
                Show responses as they are being generated
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <h3 className="text-xl font-semibold mb-2">Start a new conversation</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Send a message to start chatting with Gemini AI
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-3xl rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-12'
                      : 'bg-muted mr-12'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Input area */}
      <div className="border-t p-4">
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="w-full p-3 pr-10 border rounded-md resize-none bg-background min-h-[2.5rem]"
              rows={1}
              disabled={isProcessing || !isConnected}
            />
            {!isConnected && (
              <div className="absolute right-3 bottom-3 text-muted-foreground">
                <RefreshCw size={18} className="animate-spin" />
              </div>
            )}
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isProcessing || !isConnected}
            className="p-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}