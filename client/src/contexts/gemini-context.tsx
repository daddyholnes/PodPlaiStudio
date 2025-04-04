import { createContext, ReactNode, useCallback, useState } from 'react';
import { MessagePart, MessageRole, ModelParameters } from '@shared/schema';

export interface ModelConfig {
  model: string;
  temperature: number;
  maxOutputTokens: number;
  topK: number;
  topP: number;
  systemInstructions?: string;
}

interface GeminiContextType {
  // Model configuration
  modelConfig: ModelConfig;
  updateModelConfig: (config: Partial<ModelConfig>) => void;
  
  // Messages management
  messages: {
    role: MessageRole;
    content: MessagePart[];
  }[];
  addMessage: (role: MessageRole, content: MessagePart[]) => void;
  clearMessages: () => void;
  
  // Generation state
  isGenerating: boolean;
  generatedText: string;
  error: string | null;
  clearError: () => void;
  
  // API functions
  generateText: (prompt: string | MessagePart[]) => Promise<string>;
  generateTextStream: (
    prompt: string | MessagePart[],
    onUpdate: (text: string) => void
  ) => () => void;
  
  sendChatMessage: (content: MessagePart[]) => Promise<string>;
  sendChatMessageStream: (
    content: MessagePart[],
    onUpdate: (text: string) => void
  ) => () => void;
  
  executeCode: (code: string, language?: string) => Promise<{ output: string; error?: string }>;
  countTokens: (text: string) => Promise<number>;
}

// Default model configuration
const defaultModelConfig: ModelConfig = {
  model: 'gemini-1.5-pro',
  temperature: 0.7,
  maxOutputTokens: 2048,
  topK: 40,
  topP: 0.95,
};

// Create context with undefined as default
export const GeminiContext = createContext<GeminiContextType | undefined>(undefined);

// Provider component
export function GeminiProvider({ children }: { children: ReactNode }) {
  // Model configuration state
  const [modelConfig, setModelConfig] = useState<ModelConfig>(defaultModelConfig);
  
  // Messages state
  const [messages, setMessages] = useState<{ role: MessageRole; content: MessagePart[] }[]>([]);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Update model configuration
  const updateModelConfig = useCallback((config: Partial<ModelConfig>) => {
    setModelConfig(prev => ({ ...prev, ...config }));
  }, []);
  
  // Add a message to the messages array
  const addMessage = useCallback((role: MessageRole, content: MessagePart[]) => {
    setMessages(prev => [...prev, { role, content }]);
  }, []);
  
  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Generate text
  const generateText = useCallback(async (prompt: string | MessagePart[]): Promise<string> => {
    try {
      setIsGenerating(true);
      setError(null);
      
      // Convert string prompt to MessagePart if needed
      const formattedPrompt = typeof prompt === 'string' 
        ? [{ type: 'text', text: prompt }] 
        : prompt;
      
      // Set up parameters
      const params: ModelParameters = {
        temperature: modelConfig.temperature,
        maxOutputTokens: modelConfig.maxOutputTokens,
        topK: modelConfig.topK,
        topP: modelConfig.topP,
        stream: false,
      };
      
      if (modelConfig.systemInstructions) {
        params.systemInstructions = modelConfig.systemInstructions;
      }
      
      // Make API request
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: formattedPrompt,
          model: modelConfig.model,
          params,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate text');
      }
      
      const data = await response.json();
      setGeneratedText(data.text);
      return data.text;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return '';
    } finally {
      setIsGenerating(false);
    }
  }, [modelConfig]);
  
  // Generate text with streaming
  const generateTextStream = useCallback((
    prompt: string | MessagePart[],
    onUpdate: (text: string) => void
  ) => {
    setIsGenerating(true);
    setError(null);
    
    // Convert string prompt to MessagePart if needed
    const formattedPrompt = typeof prompt === 'string' 
      ? [{ type: 'text', text: prompt }] 
      : prompt;
    
    // Set up parameters
    const params: ModelParameters = {
      temperature: modelConfig.temperature,
      maxOutputTokens: modelConfig.maxOutputTokens,
      topK: modelConfig.topK,
      topP: modelConfig.topP,
      stream: true,
    };
    
    if (modelConfig.systemInstructions) {
      params.systemInstructions = modelConfig.systemInstructions;
    }
    
    // Use EventSource for streaming
    const eventSource = new EventSource(`/api/gemini/generate-stream?${new URLSearchParams({
      prompt: JSON.stringify(formattedPrompt),
      model: modelConfig.model,
      params: JSON.stringify(params),
    })}`);
    
    let fullText = '';
    
    const messageHandler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.error) {
          setError(data.error);
          eventSource.close();
          setIsGenerating(false);
          return;
        }
        
        fullText += data.text || '';
        setGeneratedText(fullText);
        onUpdate(fullText);
      } catch (err) {
        setError('Failed to parse streaming response');
        eventSource.close();
        setIsGenerating(false);
      }
    };
    
    const errorHandler = () => {
      setError('Stream connection error');
      eventSource.close();
      setIsGenerating(false);
    };
    
    const closeHandler = () => {
      setIsGenerating(false);
    };
    
    eventSource.addEventListener('message', messageHandler);
    eventSource.addEventListener('error', errorHandler);
    eventSource.addEventListener('close', closeHandler);
    
    // Return cleanup function
    return () => {
      eventSource.removeEventListener('message', messageHandler);
      eventSource.removeEventListener('error', errorHandler);
      eventSource.removeEventListener('close', closeHandler);
      eventSource.close();
      setIsGenerating(false);
    };
  }, [modelConfig]);
  
  // Send a chat message
  const sendChatMessage = useCallback(async (content: MessagePart[]): Promise<string> => {
    try {
      setIsGenerating(true);
      setError(null);
      
      // Add the user message to the messages array
      addMessage('user', content);
      
      // Set up parameters
      const params: ModelParameters = {
        temperature: modelConfig.temperature,
        maxOutputTokens: modelConfig.maxOutputTokens,
        topK: modelConfig.topK,
        topP: modelConfig.topP,
        stream: false,
      };
      
      if (modelConfig.systemInstructions) {
        params.systemInstructions = modelConfig.systemInstructions;
      }
      
      // Make API request
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, { role: 'user' as MessageRole, content }],
          model: modelConfig.model,
          params,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send chat message');
      }
      
      const data = await response.json();
      setGeneratedText(data.text);
      
      // Add the assistant response to the messages array
      addMessage('assistant', [{ type: 'text', text: data.text }]);
      
      return data.text;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return '';
    } finally {
      setIsGenerating(false);
    }
  }, [addMessage, messages, modelConfig]);
  
  // Send a chat message with streaming
  const sendChatMessageStream = useCallback((
    content: MessagePart[],
    onUpdate: (text: string) => void
  ) => {
    setIsGenerating(true);
    setError(null);
    
    // Add the user message to the messages array
    addMessage('user', content);
    
    // Set up parameters
    const params: ModelParameters = {
      temperature: modelConfig.temperature,
      maxOutputTokens: modelConfig.maxOutputTokens,
      topK: modelConfig.topK,
      topP: modelConfig.topP,
      stream: true,
    };
    
    if (modelConfig.systemInstructions) {
      params.systemInstructions = modelConfig.systemInstructions;
    }
    
    // Include the new user message in the messages array
    const allMessages = [...messages, { role: 'user' as MessageRole, content }];
    
    // Use EventSource for streaming
    const eventSource = new EventSource(`/api/gemini/chat-stream?${new URLSearchParams({
      messages: JSON.stringify(allMessages),
      model: modelConfig.model,
      params: JSON.stringify(params),
    })}`);
    
    let fullText = '';
    
    const messageHandler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.error) {
          setError(data.error);
          eventSource.close();
          setIsGenerating(false);
          return;
        }
        
        fullText += data.text || '';
        setGeneratedText(fullText);
        onUpdate(fullText);
      } catch (err) {
        setError('Failed to parse streaming response');
        eventSource.close();
        setIsGenerating(false);
      }
    };
    
    const errorHandler = () => {
      setError('Stream connection error');
      eventSource.close();
      setIsGenerating(false);
    };
    
    const closeHandler = () => {
      setIsGenerating(false);
      // Add the assistant response to the messages array when done
      if (fullText) {
        addMessage('assistant', [{ type: 'text', text: fullText }]);
      }
    };
    
    eventSource.addEventListener('message', messageHandler);
    eventSource.addEventListener('error', errorHandler);
    eventSource.addEventListener('close', closeHandler);
    
    // Return cleanup function
    return () => {
      eventSource.removeEventListener('message', messageHandler);
      eventSource.removeEventListener('error', errorHandler);
      eventSource.removeEventListener('close', closeHandler);
      eventSource.close();
      setIsGenerating(false);
      // Add the assistant response to the messages array when canceled
      if (fullText) {
        addMessage('assistant', [{ type: 'text', text: fullText }]);
      }
    };
  }, [addMessage, messages, modelConfig]);
  
  // Execute code
  const executeCode = useCallback(async (code: string, language = 'javascript'): Promise<{ output: string; error?: string }> => {
    try {
      setIsGenerating(true);
      setError(null);
      
      // Make API request
      const response = await fetch('/api/gemini/code/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to execute code');
      }
      
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return { output: '', error: err instanceof Error ? err.message : 'An error occurred' };
    } finally {
      setIsGenerating(false);
    }
  }, []);
  
  // Count tokens
  const countTokens = useCallback(async (text: string): Promise<number> => {
    try {
      setError(null);
      
      // Make API request
      const response = await fetch('/api/gemini/tokens/count', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to count tokens');
      }
      
      const data = await response.json();
      return data.count;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return 0;
    }
  }, []);
  
  // Provide context value
  const contextValue: GeminiContextType = {
    modelConfig,
    updateModelConfig,
    messages,
    addMessage,
    clearMessages,
    isGenerating,
    generatedText,
    error,
    clearError,
    generateText,
    generateTextStream,
    sendChatMessage,
    sendChatMessageStream,
    executeCode,
    countTokens,
  };
  
  return (
    <GeminiContext.Provider value={contextValue}>
      {children}
    </GeminiContext.Provider>
  );
}