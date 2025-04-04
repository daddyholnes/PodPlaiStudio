import { useState, useCallback, useContext } from 'react';
import { useWebSocket } from './use-websocket';
import { 
  generateText, 
  generateTextStream, 
  chatWithGemini, 
  chatWithGeminiStream,
  executeCode,
  countTokens
} from '@/lib/gemini-api';
import { MessagePart, MessageRole, ModelParameters } from '@/../../shared/schema';
import { ThemeContext } from '@/contexts/theme-context';

export function useGemini() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { useMessageHandler, sendMessage } = useWebSocket();
  const { isDarkMode } = useContext(ThemeContext) || { isDarkMode: false };
  
  // Generate text with Gemini
  const generate = useCallback(async (
    prompt: string | MessagePart[],
    modelParams?: ModelParameters
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await generateText(prompt, modelParams);
      setIsLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setIsLoading(false);
      return '';
    }
  }, []);
  
  // Generate text with streaming via WebSocket
  const generateStream = useCallback((
    prompt: string | MessagePart[],
    onUpdate: (text: string) => void,
    modelParams?: ModelParameters
  ) => {
    setIsLoading(true);
    setError(null);
    
    const requestId = generateTextStream(prompt, modelParams);
    
    // Send the generation request through WebSocket
    sendMessage({
      type: 'generate',
      id: requestId,
      prompt: typeof prompt === 'string' 
        ? [{ type: 'text', text: prompt }] 
        : prompt,
      modelParams,
      theme: isDarkMode ? 'dark' : 'light'
    });
    
    // Set up a message handler for this request
    const messageHandler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        // Check if this message is for our request
        if (data.id === requestId) {
          if (data.type === 'update') {
            onUpdate(data.text);
          } else if (data.type === 'complete') {
            setIsLoading(false);
          } else if (data.type === 'error') {
            setError(data.error);
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };
    
    // Use the message handler from useWebSocket hook
    useMessageHandler(messageHandler);
    
    // Return a function to cancel the generation
    return () => {
      sendMessage({
        type: 'cancel',
        id: requestId
      });
      setIsLoading(false);
    };
  }, [sendMessage, useMessageHandler, isDarkMode]);
  
  // Chat with Gemini
  const chat = useCallback(async (
    messages: {
      role: MessageRole;
      content: MessagePart[];
    }[],
    modelParams?: ModelParameters
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await chatWithGemini(messages, modelParams);
      setIsLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setIsLoading(false);
      return '';
    }
  }, []);
  
  // Chat with streaming via WebSocket
  const chatStream = useCallback((
    messages: {
      role: MessageRole;
      content: MessagePart[];
    }[],
    onUpdate: (text: string) => void,
    modelParams?: ModelParameters
  ) => {
    setIsLoading(true);
    setError(null);
    
    const requestId = chatWithGeminiStream(messages, modelParams);
    
    // Send the chat request through WebSocket
    sendMessage({
      type: 'chat',
      id: requestId,
      messages,
      modelParams,
      theme: isDarkMode ? 'dark' : 'light'
    });
    
    // Set up a message handler for this request
    const messageHandler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        // Check if this message is for our request
        if (data.id === requestId) {
          if (data.type === 'update') {
            onUpdate(data.text);
          } else if (data.type === 'complete') {
            setIsLoading(false);
          } else if (data.type === 'error') {
            setError(data.error);
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };
    
    // Use the message handler from useWebSocket hook
    useMessageHandler(messageHandler);
    
    // Return a function to cancel the generation
    return () => {
      sendMessage({
        type: 'cancel',
        id: requestId
      });
      setIsLoading(false);
    };
  }, [sendMessage, useMessageHandler, isDarkMode]);
  
  // Execute code with Gemini
  const execute = useCallback(async (
    code: string,
    language?: string
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await executeCode(code, language);
      setIsLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setIsLoading(false);
      return { output: '', error: errorMessage };
    }
  }, []);
  
  // Count tokens
  const getTokenCount = useCallback(async (
    text: string
  ) => {
    try {
      return await countTokens(text);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error counting tokens:', errorMessage);
      return 0;
    }
  }, []);
  
  return {
    generate,
    generateStream,
    chat,
    chatStream,
    execute,
    getTokenCount,
    isLoading,
    error,
    clearError: () => setError(null)
  };
}