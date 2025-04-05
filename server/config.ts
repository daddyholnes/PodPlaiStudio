// Centralized configuration for the PodPlay API Studio
// Contains environment variables and shared configuration settings

// Get the Gemini API key from environment variables
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Check if API key exists
export const isApiKeyConfigured = !!GEMINI_API_KEY;

// Get a masked version of the API key for display (e.g. "GEMINI_API_****")
export const getMaskedApiKey = () => {
  if (!isApiKeyConfigured) return "GEMINI_API_KEY not set";
  return `GEMINI_${'*'.repeat(Math.max(GEMINI_API_KEY.length - 7, 4))}`;
};

// Gemini API base URL
export const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1";

// Models available in Gemini
export const GEMINI_MODELS = {
  // Gemini 2.5 models
  "gemini-2.5-pro-preview-03-25": "models/gemini-2.5-pro-preview-03-25", // Default - Enhanced thinking and reasoning
  
  // Gemini 2.0 models
  "gemini-2.0-flash": "models/gemini-2.0-flash", // Next generation features, speed, thinking
  "gemini-2.0-flash-lite": "models/gemini-2.0-flash-lite", // Cost efficiency and low latency
  
  // Gemini 1.5 models
  "gemini-1.5-flash": "models/gemini-1.5-flash", // Fast and versatile performance
  "gemini-1.5-flash-8b": "models/gemini-1.5-flash-8b", // High volume and lower intelligence tasks
  "gemini-1.5-pro": "models/gemini-1.5-pro", // Complex reasoning tasks requiring more intelligence
  
  // Legacy models
  "gemini-pro": "models/gemini-pro", // Gemini 1.0 Pro
  "gemini-1.0-pro": "models/gemini-pro", // Legacy name mapping

  // Embeddings
  "gemini-embedding-exp": "models/gemini-embedding-exp", // Text embeddings
};

// Default model to use
export const DEFAULT_MODEL = "gemini-2.5-pro-preview-03-25";

// Validate the application configuration
export const validateConfig = () => {
  if (!isApiKeyConfigured) {
    console.error("GEMINI_API_KEY is not set. Please set the environment variable.");
    return false;
  }
  return true;
};