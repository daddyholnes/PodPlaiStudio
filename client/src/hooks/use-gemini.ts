import { useContext } from 'react';
import { GeminiContext } from '@/contexts/gemini-context';

export function useGemini() {
  const context = useContext(GeminiContext);
  
  if (!context) {
    throw new Error('useGemini must be used within a GeminiProvider');
  }
  
  return context;
}
