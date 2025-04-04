import { useContext } from 'react';
import { useGeminiContext } from '@/hooks/use-gemini-context';
import { useWebSocket } from '@/hooks/use-websocket';
import { MessagePart, MessageRole, ModelParameters } from '@/../../shared/schema';
import { ThemeContext } from '@/contexts/theme-context';

export function useGemini() {
  const geminiContext = useGeminiContext();
  const { isDarkMode } = useContext(ThemeContext) || { isDarkMode: false };
  const { sendMessage } = useWebSocket();
  
  // Extract what we need from the context
  const { 
    modelConfig,
    updateModelConfig,
    isGenerating,
    error,
    clearError,
    generateText,
    generateTextStream,
    sendChatMessage,
    sendChatMessageStream
  } = geminiContext;
  
  // Map to expected API properties
  return {
    // Model configuration
    selectedModel: modelConfig.model,
    parameters: {
      temperature: modelConfig.temperature,
      maxOutputTokens: modelConfig.maxOutputTokens,
      topK: modelConfig.topK,
      topP: modelConfig.topP,
      systemInstructions: modelConfig.systemInstructions,
      stream: true
    },
    
    // Message sending functions
    sendMessageToGemini: async (
      model: string,
      messages: { role: MessageRole; content: MessagePart[] }[],
      params?: Partial<ModelParameters>
    ) => {
      // Update model config if different
      if (model !== modelConfig.model) {
        updateModelConfig({ model });
      }
      
      // Extract the last user message
      const lastMessage = messages[messages.length - 1];
      
      // Send the message
      const result = await sendChatMessage(lastMessage.content);
      return { 
        candidates: [{ 
          content: { 
            parts: [{ text: result }] 
          } 
        }] 
      };
    },
    
    // Old API functions for compatibility
    generate: generateText,
    generateStream: generateTextStream,
    
    // State
    isLoading: isGenerating,
    error,
    clearError
  };
}