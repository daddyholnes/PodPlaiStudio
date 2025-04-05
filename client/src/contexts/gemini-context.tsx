import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ModelParameters, GEMINI_MODELS, DEFAULT_MODEL_ID, type GeminiModelId } from '@shared/schema';

// Create a frontend-friendly model map for display
const DISPLAY_MODEL_NAMES = Object.fromEntries(
  Object.entries(GEMINI_MODELS).map(([id, model]) => [id, model.displayName])
);

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
  availableModels: Record<string, string>;
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
  // Use the default model from schema
  const [modelConfig, setModelConfig] = useState<ModelConfig>(getDefaultConfig(DEFAULT_MODEL_ID));

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
        availableModels: DISPLAY_MODEL_NAMES,
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