// Configuration handling for PodPlay API Studio

// Environment variable for Gemini API key (will exist if set in the Replit Secrets)
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Session secret for Express sessions
export const SESSION_SECRET = process.env.SESSION_SECRET || 'podplay-api-studio-secret';

// Default API configuration
export const DEFAULT_MODEL = 'gemini-pro';
export const DEFAULT_VISION_MODEL = 'gemini-pro-vision';
export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_MAX_OUTPUT_TOKENS = 1024;
export const DEFAULT_TOP_K = 1;
export const DEFAULT_TOP_P = 0.95;

// Available models
export const AVAILABLE_MODELS = [
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    description: 'Best for text-only prompts, reasoning, and code generation',
    inputTypes: ['text'],
    maxInputTokens: 30720,
    maxOutputTokens: 8192,
  },
  {
    id: 'gemini-pro-vision',
    name: 'Gemini Pro Vision',
    description: 'Best for multimodal prompts with text and images',
    inputTypes: ['text', 'image'],
    maxInputTokens: 12288,
    maxOutputTokens: 4096,
  },
];

// Validate that the configuration is valid and that we have a usable Gemini API key
export function validateConfig() {
  // Check for API key from environment or storage
  if (!GEMINI_API_KEY) {
    console.warn('No Gemini API key found in environment variables. Using storage settings if available.');
  }
  
  return {
    geminiApiKey: GEMINI_API_KEY,
    isApiKeyInEnv: !!GEMINI_API_KEY,
  };
}

// Utility to get a masked version of an API key for display
export function maskApiKey(key: string): string {
  if (!key) return '';
  
  if (key.length <= 8) {
    return '*'.repeat(key.length);
  }
  
  // Show first 4 and last 4 characters, mask the rest
  return `${key.slice(0, 4)}${'*'.repeat(key.length - 8)}${key.slice(-4)}`;
}