// Direct re-export of the gemini context hook
import { useGeminiContext as useOriginalGeminiContext } from '../contexts/gemini-context';

// Simply re-export the original hook
export const useGeminiContext = useOriginalGeminiContext;