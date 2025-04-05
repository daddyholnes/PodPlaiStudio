import { useState, useCallback, useMemo } from 'react';
import { useWebSocket } from './use-websocket';
import { GeminiCodeAssistantService } from '../services/GeminiCodeAssistantService';
import { toast } from './use-toast';

interface CodeGenerationResponse {
  code: string;
  explanation?: string;
  filePath?: string;
  language?: string;
  dependencies?: string[];
  projectStructure?: { [key: string]: string };
}

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
      console.error('Error generating code:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate code. Please try again.',
        variant: 'destructive'
      });
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
      console.error('Error modifying code:', error);
      toast({
        title: 'Error',
        description: 'Failed to modify code. Please try again.',
        variant: 'destructive'
      });
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
      console.error('Error explaining code:', error);
      toast({
        title: 'Error',
        description: 'Failed to explain code. Please try again.',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [service]);
  
  const generateProject = useCallback(async (description: string, options: {
    language: string;
    framework?: string;
    projectType?: string;
    includeTests?: boolean;
    includeDocumentation?: boolean;
  }) => {
    setIsProcessing(true);
    try {
      const result = await service.generateProject(description, options);
      return result;
    } catch (error) {
      console.error('Error generating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate project. Please try again.',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [service]);
  
  const fixCode = useCallback(async (code: string, errorMessage: string, language: string) => {
    setIsProcessing(true);
    try {
      const result = await service.fixCode(code, errorMessage, language);
      return result;
    } catch (error) {
      console.error('Error fixing code:', error);
      toast({
        title: 'Error',
        description: 'Failed to fix code. Please try again.',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [service]);
  
  return {
    generateCode,
    modifyCode,
    explainCode,
    generateProject,
    fixCode,
    isProcessing
  };
}
