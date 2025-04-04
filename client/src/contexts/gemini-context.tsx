import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ModelParameters } from '@shared/schema';

// Define available Gemini models
export const GEMINI_MODELS = {
  'gemini-1.0-pro': 'Gemini 1.0 Pro',
  'gemini-1.5-pro': 'Gemini 1.5 Pro',
  'gemini-1.5-flash': 'Gemini 1.5 Flash',
  'gemini-2.5-pro-preview-03-25': 'Gemini 2.5 Pro (Preview)',
};

// Model config includes the selected model and its parameters
export interface ModelConfig extends ModelParameters {
  model: string;
  systemInstructions?: string;
}

// Context interface
interface GeminiContextType {
  modelConfig: ModelConfig;
  updateModelConfig: (config: Partial<ModelConfig>) => void;
  resetModelConfig: () => void;
  availableModels: typeof GEMINI_MODELS;
}

// Default parameters for each model
const getDefaultConfig = (model: string): ModelConfig => ({
  model,
  temperature: 0.7,
  maxOutputTokens: 8192,
  topK: 40,
  topP: 0.95,
  stream: true,
  systemInstructions: 'You are PodPlay Assistant, a helpful AI built to assist with coding, content generation, and answering questions.'
});

// Create the context
const GeminiContext = createContext<GeminiContextType | null>(null);

// Create the provider component
export function GeminiProvider({ children }: { children: ReactNode }) {
  // Default to the most advanced model
  const defaultModel = 'gemini-2.5-pro-preview-03-25';
  const [modelConfig, setModelConfig] = useState<ModelConfig>(getDefaultConfig(defaultModel));

  // Update model configuration
  const updateModelConfig = (config: Partial<ModelConfig>) => {
    setModelConfig(prev => {
      // If model is being changed, reset to default parameters for that model
      if (config.model && config.model !== prev.model) {
        return { ...getDefaultConfig(config.model), ...config };
      }
      // Otherwise just update the specified parameters
      return { ...prev, ...config };
    });
  };

  // Reset model parameters to default
  const resetModelConfig = () => {
    setModelConfig(getDefaultConfig(modelConfig.model));
  };

  return (
    <GeminiContext.Provider
      value={{
        modelConfig,
        updateModelConfig,
        resetModelConfig,
        availableModels: GEMINI_MODELS,
      }}
    >
      {children}
    </GeminiContext.Provider>
  );
}

// Create a hook to use the context
export function useGeminiContext(): GeminiContextType {
  const context = useContext(GeminiContext);
  
  if (!context) {
    throw new Error('useGeminiContext must be used within a GeminiProvider');
  }
  
  return context;
}