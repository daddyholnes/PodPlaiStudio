import { useState, useCallback, useContext } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { MessagePart, MessageRole, ModelParameters } from '@/../../shared/schema';
import { ThemeContext } from '@/contexts/theme-context';

// Basic default parameters for Gemini models
const defaultParameters = {
  temperature: 0.7,
  maxOutputTokens: 2048,
  topK: 40,
  topP: 0.95,
  systemInstructions: "You are PodPlay Assistant, a helpful AI built to assist with coding, content generation, and answering questions.",
  stream: true
};

export function useGemini() {
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-pro');
  const [parameters, setParameters] = useState<ModelParameters & {systemInstructions?: string}>(defaultParameters);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDarkMode } = useContext(ThemeContext) || { isDarkMode: false };
  const { socket, isConnected, sendMessage, useMessageHandler } = useWebSocket();
  
  // Function to update model parameters
  const updateModelParameters = useCallback((newParams: Partial<ModelParameters & {systemInstructions?: string}>) => {
    setParameters(prev => ({
      ...prev,
      ...newParams
    }));
  }, []);
  
  // Function to change the selected model
  const changeModel = useCallback((model: string) => {
    setSelectedModel(model);
  }, []);
  
  // Generate text with Gemini
  const generate = useCallback(async (
    prompt: string | MessagePart[],
    modelParams?: Partial<ModelParameters>
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Format the request
      const formattedPrompt = typeof prompt === 'string' 
        ? [{ type: 'text' as const, text: prompt }]
        : prompt;
        
      // Combine default parameters with provided ones
      const combinedParams = {
        ...parameters,
        ...modelParams
      };
      
      // Make API request
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: formattedPrompt }],
          params: combinedParams,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate text');
      }
      
      const data = await response.json();
      setIsLoading(false);
      return data.text;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setIsLoading(false);
      return '';
    }
  }, [parameters, selectedModel]);
  
  // Send a message to Gemini (for chat)
  const sendMessageToGemini = useCallback(async (
    model: string,
    messages: { role: MessageRole; content: MessagePart[] }[],
    customParams?: Partial<ModelParameters>
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the provided model or fallback to selected model
      const useModel = model || selectedModel;
      
      // Combine parameters
      const combinedParams = {
        ...parameters,
        ...customParams
      };
      
      // Make API request
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: useModel,
          messages,
          params: combinedParams,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to chat with Gemini');
      }
      
      const data = await response.json();
      setIsLoading(false);
      
      // Return response in the expected format
      return {
        candidates: [{
          content: {
            parts: [{ text: data.text }]
          }
        }]
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setIsLoading(false);
      return { candidates: [] };
    }
  }, [parameters, selectedModel]);
  
  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    // Model configuration
    selectedModel,
    parameters,
    setSelectedModel: changeModel,
    updateModelParameters,
    
    // API functions
    generate,
    sendMessageToGemini,
    
    // WebSocket (needed for component interfaces)
    socket,
    isConnected,
    
    // State
    isLoading,
    error,
    clearError
  };
}