import { apiRequest } from '@/lib/queryClient';
import { useWebSocket } from '@/hooks/use-websocket';

// Response type for code generation
interface CodeGenerationResponse {
  code: string;
  explanation?: string;
  filePath?: string;
  language?: string;
  dependencies?: string[];
  projectStructure?: { [key: string]: string };
}

/**
 * Service for interacting with Gemini AI for code-specific tasks
 */
export class GeminiCodeAssistantService {
  private baseUrl = '/api/gemini';
  private webSocket: WebSocket | null = null;
  
  constructor(webSocket: WebSocket | null = null) {
    this.webSocket = webSocket;
  }
  
  /**
   * Generate code from a natural language description
   * @param prompt Natural language description of the code to generate
   * @param options Additional generation options
   * @returns Generated code and related information
   */
  async generateCode(
    prompt: string, 
    options: {
      language?: string;
      framework?: string;
      fileType?: string;
      includeExplanation?: boolean;
      includeTests?: boolean;
    } = {}
  ): Promise<CodeGenerationResponse> {
    const enhancedPrompt = this.enhancePrompt(prompt, options);
    
    try {
      const response = await apiRequest(`${this.baseUrl}/code/generate`, 'POST', {
        prompt: enhancedPrompt,
        options
      });
      
      return response as CodeGenerationResponse;
    } catch (error) {
      console.error('Error generating code:', error);
      throw new Error('Failed to generate code');
    }
  }
  
  /**
   * Modify existing code based on natural language instructions
   * @param code Existing code to modify
   * @param instructions Natural language instructions for modifications
   * @param language Programming language of the code
   * @returns Modified code and explanation
   */
  async modifyCode(
    code: string,
    instructions: string,
    language: string
  ): Promise<CodeGenerationResponse> {
    try {
      const response = await apiRequest(`${this.baseUrl}/code/modify`, 'POST', {
        code,
        instructions,
        language
      });
      
      return response as CodeGenerationResponse;
    } catch (error) {
      console.error('Error modifying code:', error);
      throw new Error('Failed to modify code');
    }
  }
  
  /**
   * Explain code with detailed comments and documentation
   * @param code Code to explain
   * @param language Programming language of the code
   * @returns Explanation of the code
   */
  async explainCode(
    code: string,
    language?: string
  ): Promise<string> {
    try {
      const response = await apiRequest(`${this.baseUrl}/code/explain`, 'POST', {
        code,
        language
      });
      
      return response.explanation;
    } catch (error) {
      console.error('Error explaining code:', error);
      throw new Error('Failed to explain code');
    }
  }
  
  /**
   * Generate a complete project structure from natural language description
   * @param description Project description
   * @param options Project options including framework, language, etc.
   * @returns Project structure with files and their contents
   */
  async generateProject(
    description: string,
    options: {
      language: string;
      framework?: string;
      projectType?: string;
      includeTests?: boolean;
      includeDocumentation?: boolean;
    }
  ): Promise<{ [filePath: string]: string }> {
    try {
      const response = await apiRequest(`${this.baseUrl}/code/project`, 'POST', {
        description,
        options
      });
      
      return response.files;
    } catch (error) {
      console.error('Error generating project:', error);
      throw new Error('Failed to generate project');
    }
  }
  
  /**
   * Fix bugs in code based on error messages and code
   * @param code Code with bugs
   * @param errorMessage Error message from the compiler/runtime
   * @param language Programming language of the code
   * @returns Fixed code and explanation of the fixes
   */
  async fixCode(
    code: string,
    errorMessage: string,
    language: string
  ): Promise<CodeGenerationResponse> {
    try {
      const response = await apiRequest(`${this.baseUrl}/code/fix`, 'POST', {
        code,
        errorMessage,
        language
      });
      
      return response as CodeGenerationResponse;
    } catch (error) {
      console.error('Error fixing code:', error);
      throw new Error('Failed to fix code');
    }
  }
  
  /**
   * Enhance a code prompt with additional context
   * @param prompt Original prompt
   * @param options Prompt enhancement options
   * @returns Enhanced prompt
   */
  private enhancePrompt(
    prompt: string,
    options: any
  ): string {
    let enhancedPrompt = prompt;
    
    // Add language preference
    if (options.language) {
      enhancedPrompt += `\n\nPlease provide the solution in ${options.language}.`;
    }
    
    // Add framework preference
    if (options.framework) {
      enhancedPrompt += `\n\nUse the ${options.framework} framework.`;
    }
    
    // Request explanation if needed
    if (options.includeExplanation) {
      enhancedPrompt += '\n\nPlease include explanations for your implementation.';
    }
    
    // Request tests if needed
    if (options.includeTests) {
      enhancedPrompt += '\n\nPlease include unit tests for the code.';
    }
    
    return enhancedPrompt;
  }
}

// Create a hook to use the GeminiCodeAssistant service
export function useGeminiCodeAssistant() {
  const { socket, isConnected } = useWebSocket();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const service = useMemo(() => {
    return new GeminiCodeAssistantService(isConnected ? socket : null);
  }, [socket, isConnected]);
  
  const generateCode = useCallback(async (prompt: string, options = {}) => {
    setIsProcessing(true);
    try {
      const result = await service.generateCode(prompt, options);
      return result;
    } catch (error) {
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [service]);
  
  const modifyCode = useCallback(async (code: string, instructions: string, language: string) => {
    setIsProcessing(true);
    try {
      const result = await service.modifyCode(code, instructions, language);
      return result;
    } catch (error) {
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [service]);
  
  const explainCode = useCallback(async (code: string, language?: string) => {
    setIsProcessing(true);
    try {
      const result = await service.explainCode(code, language);
      return result;
    } catch (error) {
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [service]);
  
  return {
    generateCode,
    modifyCode,
    explainCode,
    isProcessing
  };
}
