import { createContext, useState, useCallback, ReactNode } from 'react';
import { generateContent, type GeminiParameters, type GeminiMessage } from '@/lib/gemini-api';
import { useToast } from '@/hooks/use-toast';

// Default parameters
const DEFAULT_PARAMETERS: GeminiParameters = {
  temperature: 0.7,
  maxOutputTokens: 2048,
  topK: 40,
  topP: 0.8,
  stream: true,
  systemInstructions: 'You are PodPlay Assistant, a helpful AI built to assist with coding, content generation, and answering questions.'
};

// Context type
interface GeminiContextType {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  parameters: GeminiParameters;
  updateParameters: (params: Partial<GeminiParameters>) => void;
  sendMessageToGemini: (model: string, messages: GeminiMessage[], parameters: GeminiParameters) => Promise<any>;
  streamResponse: boolean;
  setStreamResponse: (stream: boolean) => void;
}

// Create the context
export const GeminiContext = createContext<GeminiContextType | null>(null);

// Provider component
export function GeminiProvider({ children }: { children: ReactNode }) {
  const [selectedModel, setSelectedModel] = useState('gemini-pro');
  const [parameters, setParameters] = useState<GeminiParameters>(DEFAULT_PARAMETERS);
  const [streamResponse, setStreamResponse] = useState(true);
  const { toast } = useToast();
  
  // Update parameters
  const updateParameters = useCallback((params: Partial<GeminiParameters>) => {
    setParameters(prev => ({ ...prev, ...params }));
  }, []);
  
  // Send message to Gemini API
  const sendMessageToGemini = useCallback(async (
    model: string, 
    messages: GeminiMessage[], 
    params: GeminiParameters
  ) => {
    try {
      const response = await generateContent(model, messages, params);
      return response;
    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to communicate with Gemini API',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);
  
  // Context value
  const value = {
    selectedModel,
    setSelectedModel,
    parameters,
    updateParameters,
    sendMessageToGemini,
    streamResponse,
    setStreamResponse
  };
  
  return (
    <GeminiContext.Provider value={value}>
      {children}
    </GeminiContext.Provider>
  );
}
