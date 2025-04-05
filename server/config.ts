// Centralized configuration for the PodPlay API Studio
// Contains environment variables and shared configuration settings

// Import required modules
import os from 'os';
import { GEMINI_MODELS, DEFAULT_MODEL_ID } from "@shared/schema";

// Get the Gemini API key from environment variables, checking both process.env and os.environ
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Log the API key status (masked for security)
console.log("Gemini API Key Status:", GEMINI_API_KEY ? "Found" : "Not found");

// Check if API key exists
export const isApiKeyConfigured = !!GEMINI_API_KEY;

// Get a masked version of the API key for display (e.g. "GEMINI_API_****")
export const getMaskedApiKey = () => {
  if (!isApiKeyConfigured) return "GEMINI_API_KEY not set";
  return `GEMINI_${'*'.repeat(Math.max(GEMINI_API_KEY.length - 7, 4))}`;
};

// Gemini API base URL
export const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1";

// Default model to use
export const DEFAULT_MODEL = DEFAULT_MODEL_ID;

// Validate the application configuration
export const validateConfig = () => {
  console.log("Environment check for Gemini API key:");
  console.log("- process.env.GEMINI_API_KEY present:", !!process.env.GEMINI_API_KEY);
  console.log("- API Key first 4 chars:", GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 4) + '...' : 'None');
  console.log("- API Key length:", GEMINI_API_KEY?.length || 0);
  
  if (!isApiKeyConfigured) {
    console.error("GEMINI_API_KEY is not set. Please set the environment variable.");
    return false;
  }
  
  console.log("Configuration validated successfully");
  return true;
};