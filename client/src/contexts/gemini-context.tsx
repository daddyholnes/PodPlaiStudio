import { createContext, useState, useEffect, ReactNode } from 'react';
import { MessagePart, MessageRole, ModelParameters } from '@/../../shared/schema';
import { useGemini } from '@/hooks/use-gemini';

// Define the ModelConfig type
export interface ModelConfig {
  model: string;
  temperature: number;
  maxOutputTokens: number;
  topK: number;
  topP: number;
}

// Define the GeminiContextType
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

// Create the Gemini context
export const GeminiContext = createContext<GeminiContextType | undefined>(undefined);

// Create the Gemini provider component
export function GeminiProvider({ children }: { children: ReactNode }) {
  // Use the Gemini hook
  const {
    generate,
    generateStream,
    chat,
    chatStream,
    execute,
    getTokenCount,
    isLoading,
    error,
    clearError
  } = useGemini();
  
  // Model configuration state
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    model: 'gemini-1.5-pro',
    temperature: 0.7,
    maxOutputTokens: 2048,
    topK: 40,
    topP: 0.95
  });
  
  // Messages state
  const [messages, setMessages] = useState<{
    role: MessageRole;
    content: MessagePart[];
  }[]>([]);
  
  // Generated text state
  const [generatedText, setGeneratedText] = useState('');
  
  // Update model configuration
  const updateModelConfig = (config: Partial<ModelConfig>) => {
    setModelConfig(prev => ({ ...prev, ...config }));
  };
  
  // Add a message to the conversation
  const addMessage = (role: MessageRole, content: MessagePart[]) => {
    setMessages(prev => [...prev, { role, content }]);
  };
  
  // Clear all messages
  const clearMessages = () => {
    setMessages([]);
  };
  
  // Generate text using the current model configuration
  const generateText = async (prompt: string | MessagePart[]): Promise<string> => {
    const params: ModelParameters = {
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      maxOutputTokens: modelConfig.maxOutputTokens,
      topK: modelConfig.topK,
      topP: modelConfig.topP
    };
    
    const result = await generate(prompt, params);
    setGeneratedText(result);
    return result;
  };
  
  // Generate text stream using the current model configuration
  const generateTextStream = (
    prompt: string | MessagePart[],
    onUpdate: (text: string) => void
  ) => {
    const params: ModelParameters = {
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      maxOutputTokens: modelConfig.maxOutputTokens,
      topK: modelConfig.topK,
      topP: modelConfig.topP
    };
    
    let fullText = '';
    
    // Create a wrapper for onUpdate that also updates the generatedText state
    const updateHandler = (text: string) => {
      fullText = text;
      setGeneratedText(text);
      onUpdate(text);
    };
    
    return generateStream(prompt, updateHandler, params);
  };
  
  // Send a chat message using the current model configuration
  const sendChatMessage = async (content: MessagePart[]): Promise<string> => {
    const params: ModelParameters = {
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      maxOutputTokens: modelConfig.maxOutputTokens,
      topK: modelConfig.topK,
      topP: modelConfig.topP
    };
    
    // Add the user message to the conversation
    addMessage('user', content);
    
    // Send the chat message to the API
    const result = await chat([...messages, { role: 'user', content }], params);
    
    // Add the assistant's response to the conversation
    addMessage('assistant', [{ type: 'text', text: result }]);
    
    return result;
  };
  
  // Send a chat message stream using the current model configuration
  const sendChatMessageStream = (
    content: MessagePart[],
    onUpdate: (text: string) => void
  ) => {
    const params: ModelParameters = {
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      maxOutputTokens: modelConfig.maxOutputTokens,
      topK: modelConfig.topK,
      topP: modelConfig.topP
    };
    
    // Add the user message to the conversation
    addMessage('user', content);
    
    let assistantResponse = '';
    
    // Create a wrapper for onUpdate that also saves the final response
    const updateHandler = (text: string) => {
      assistantResponse = text;
      onUpdate(text);
    };
    
    // Send the chat message stream
    const cancelStream = chatStream(
      [...messages, { role: 'user', content }], 
      updateHandler,
      params
    );
    
    // Return a function that will clean up the stream and add the assistant's response
    return () => {
      cancelStream();
      
      // Only add the assistant's response if there is text
      if (assistantResponse) {
        addMessage('assistant', [{ type: 'text', text: assistantResponse }]);
      }
    };
  };
  
  return (
    <GeminiContext.Provider
      value={{
        modelConfig,
        updateModelConfig,
        messages,
        addMessage,
        clearMessages,
        isGenerating: isLoading,
        generatedText,
        error,
        clearError,
        generateText,
        generateTextStream,
        sendChatMessage,
        sendChatMessageStream,
        executeCode: execute,
        countTokens: getTokenCount
      }}
    >
      {children}
    </GeminiContext.Provider>
  );
}