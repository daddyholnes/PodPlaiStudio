import { useContext } from 'react';
import { GeminiContext } from '@/contexts/gemini-context';

export function useGeminiContext() {
  const context = useContext(GeminiContext);
  
  if (!context) {
    throw new Error('useGeminiContext must be used within a GeminiProvider');
  }
  
  return context;
}