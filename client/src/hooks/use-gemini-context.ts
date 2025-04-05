import { useContext } from 'react';
import { GeminiContext } from '../contexts/gemini-context';

export interface ModelConfig {
  model: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
}

export interface GeminiContextType {
  modelConfig: ModelConfig;
  updateModelConfig: (config: Partial<ModelConfig>) => void;
  availableModels: Record<string, string>;
}

export function useGeminiContext(): GeminiContextType {
  const context = useContext(GeminiContext);
  
  if (!context) {
    throw new Error('useGeminiContext must be used within a GeminiProvider');
  }
  
  return context;
}

// Default models available in the application
export const DEFAULT_MODELS = {
  'gemini-pro': 'Gemini Pro',
  'gemini-pro-vision': 'Gemini Pro Vision',
};

// Default model configuration
export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  model: 'gemini-pro',
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 2048,
};
