import { useState, useCallback } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { MessagePart, MessageRole, ModelParameters } from '@shared/schema';
import { useTheme } from '@/hooks/use-theme';
import { useGeminiContext } from '@/hooks/use-gemini-context';

export function useGemini() {
  const { modelConfig } = useGeminiContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDarkMode } = useTheme();
  const websocket = useWebSocket({
    onMessage: (event) => {
      // Handle websocket messages here if needed
    }
  });
  
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
        ...modelConfig,
        ...modelParams
      };
      
      // Make API request
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelConfig.model,
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
  }, [modelConfig]);
  
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
      const useModel = model || modelConfig.model;
      
      // Combine parameters
      const combinedParams = {
        ...modelConfig,
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
  }, [modelConfig]);
  
  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    // API functions
    generate,
    sendMessageToGemini,
    
    // WebSocket status and connection
    websocket,
    
    // State
    isLoading,
    error,
    clearError
  };
}