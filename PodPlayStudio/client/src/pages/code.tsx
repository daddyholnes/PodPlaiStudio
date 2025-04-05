import { useState, useRef, useEffect } from 'react';
import { useApiStatus } from '@/hooks/use-api-status';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { Play, Save, Settings, RotateCcw, Download, Copy, RefreshCw } from 'lucide-react';

interface CodeSandboxState {
  prompt: string;
  code: string;
  output: string;
  isLoading: boolean;
  language: string;
  fileName: string;
}

interface ModelConfig {
  model: string;
  temperature: number;
  maxOutputTokens?: number;
}

export default function CodePage() {
  const { isApiConfigured, isLoading: isApiStatusLoading } = useApiStatus();
  const { success, error } = useToast();
  
  const [showConfig, setShowConfig] = useState(false);
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    model: 'gemini-1.5-pro-latest',
    temperature: 0.2,
    maxOutputTokens: 2048
  });
  
  const [sandbox, setSandbox] = useState<CodeSandboxState>({
    prompt: '',
    code: '',
    output: '',
    isLoading: false,
    language: 'javascript',
    fileName: 'code.js'
  });

  const promptRef = useRef<HTMLTextAreaElement>(null);
  const codeRef = useRef<HTMLTextAreaElement>(null);
  
  // Supported languages and their file extensions
  const LANGUAGES = [
    { name: 'JavaScript', value: 'javascript', extension: 'js' },
    { name: 'Python', value: 'python', extension: 'py' },
    { name: 'HTML', value: 'html', extension: 'html' },
    { name: 'CSS', value: 'css', extension: 'css' },
    { name: 'TypeScript', value: 'typescript', extension: 'ts' },
    { name: 'Java', value: 'java', extension: 'java' },
    { name: 'C', value: 'c', extension: 'c' },
    { name: 'C++', value: 'cpp', extension: 'cpp' },
    { name: 'C#', value: 'csharp', extension: 'cs' },
    { name: 'Go', value: 'go', extension: 'go' },
    { name: 'Ruby', value: 'ruby', extension: 'rb' },
    { name: 'PHP', value: 'php', extension: 'php' },
    { name: 'Swift', value: 'swift', extension: 'swift' },
    { name: 'Kotlin', value: 'kotlin', extension: 'kt' },
    { name: 'Rust', value: 'rust', extension: 'rs' },
  ];
  
  // Handle language change and update file extension
  const handleLanguageChange = (language: string) => {
    const selectedLang = LANGUAGES.find(lang => lang.value === language);
    if (selectedLang) {
      setSandbox(prev => ({
        ...prev,
        language,
        fileName: `code.${selectedLang.extension}`
      }));
    }
  };
  
  // Generate code from prompt
  const generateCode = async () => {
    if (!sandbox.prompt.trim() || sandbox.isLoading) return;
    
    try {
      setSandbox(prev => ({ ...prev, isLoading: true, output: '' }));
      
      const response = await apiRequest('/api/code/generate', 'POST', {
        prompt: sandbox.prompt,
        language: sandbox.language,
        modelConfig
      });
      
      setSandbox(prev => ({
        ...prev,
        code: response.code,
        isLoading: false
      }));
      
      success('Code generated successfully');
    } catch (err) {
      console.error('Error generating code:', err);
      error('Failed to generate code');
      setSandbox(prev => ({ ...prev, isLoading: false }));
    }
  };
  
  // Execute code and get output
  const executeCode = async () => {
    if (!sandbox.code.trim() || sandbox.isLoading) return;
    
    try {
      setSandbox(prev => ({ ...prev, isLoading: true, output: 'Running code...' }));
      
      const response = await apiRequest('/api/code/execute', 'POST', {
        code: sandbox.code,
        language: sandbox.language
      });
      
      setSandbox(prev => ({
        ...prev,
        output: response.output,
        isLoading: false
      }));
    } catch (err) {
      console.error('Error executing code:', err);
      error('Failed to execute code');
      setSandbox(prev => ({ 
        ...prev, 
        isLoading: false,
        output: err instanceof Error ? err.message : 'Execution failed with unknown error'
      }));
    }
  };
  
  // Save code to a file
  const saveCode = async () => {
    try {
      const response = await apiRequest('/api/code/save', 'POST', {
        code: sandbox.code,
        fileName: sandbox.fileName
      });
      
      success(`Code saved as ${response.fileName}`);
    } catch (err) {
      console.error('Error saving code:', err);
      error('Failed to save code');
    }
  };
  
  // Clear the current code
  const clearCode = () => {
    setSandbox(prev => ({
      ...prev,
      code: '',
      output: ''
    }));
  };
  
  // Download code as a file
  const downloadCode = () => {
    const element = document.createElement('a');
    const file = new Blob([sandbox.code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = sandbox.fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  // Copy code to clipboard
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(sandbox.code);
      success('Code copied to clipboard');
    } catch (err) {
      console.error('Error copying code:', err);
      error('Failed to copy code');
    }
  };
  
  // Update model configuration
  const updateModelConfig = (key: string, value: any) => {
    setModelConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Resize textarea based on content
  const resizeTextarea = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 500)}px`;
  };
  
  // Handle prompt textarea input
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSandbox(prev => ({ ...prev, prompt: e.target.value }));
    if (promptRef.current) {
      resizeTextarea(promptRef.current);
    }
  };
  
  // Handle code textarea input
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSandbox(prev => ({ ...prev, code: e.target.value }));
    if (codeRef.current) {
      resizeTextarea(codeRef.current);
    }
  };
  
  // Handle file name input
  const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSandbox(prev => ({ ...prev, fileName: e.target.value }));
  };
  
  // Adjust text areas on initial load
  useEffect(() => {
    if (promptRef.current) {
      resizeTextarea(promptRef.current);
    }
    if (codeRef.current) {
      resizeTextarea(codeRef.current);
    }
  }, []);
  
  // If API is not configured, show a prompt to configure it
  if (!isApiConfigured && !isApiStatusLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-16rem)] text-center px-4">
        <h2 className="text-xl font-semibold mb-4">API Key Required</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          To use the Code feature, you need to configure your Gemini API key in the settings.
        </p>
        <Link href="/settings">
          <a className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            <Settings size={16} />
            <span>Go to Settings</span>
          </a>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b py-2 px-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Code Sandbox</h1>
        
        <div className="flex items-center gap-2">
          <button
            onClick={clearCode}
            className="p-2 rounded-md hover:bg-muted"
            title="Clear code"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 rounded-md hover:bg-muted"
            title="Model settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
      
      {/* Model configuration (collapsible) */}
      {showConfig && (
        <div className="p-4 border-b bg-muted/50">
          <h2 className="text-sm font-medium mb-3">Model Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="model" className="block text-sm font-medium mb-1">
                Model
              </label>
              <select
                id="model"
                value={modelConfig.model}
                onChange={(e) => updateModelConfig('model', e.target.value)}
                className="w-full p-2 rounded-md border bg-background"
              >
                <option value="gemini-1.5-pro-latest">Gemini 1.5 Pro</option>
                <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash</option>
                <option value="gemini-1.0-pro">Gemini 1.0 Pro</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="temperature" className="block text-sm font-medium mb-1">
                Temperature: {modelConfig.temperature}
              </label>
              <input
                id="temperature"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={modelConfig.temperature}
                onChange={(e) => updateModelConfig('temperature', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label htmlFor="maxTokens" className="block text-sm font-medium mb-1">
                Max Output Tokens
              </label>
              <input
                id="maxTokens"
                type="number"
                value={modelConfig.maxOutputTokens}
                onChange={(e) => updateModelConfig('maxOutputTokens', parseInt(e.target.value) || 2048)}
                className="w-full p-2 rounded-md border bg-background"
              />
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Left Column - Prompt and Controls */}
        <div className="flex flex-col">
          <h2 className="text-lg font-medium mb-2">Prompt</h2>
          <div className="mb-4">
            <textarea
              ref={promptRef}
              value={sandbox.prompt}
              onChange={handlePromptChange}
              placeholder="Describe the code you want to generate..."
              className="w-full p-3 border rounded-md bg-background resize-none min-h-[150px]"
              disabled={sandbox.isLoading}
            />
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={generateCode}
              disabled={!sandbox.prompt.trim() || sandbox.isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {sandbox.isLoading ? <RefreshCw size={16} className="animate-spin" /> : null}
              <span>Generate Code</span>
            </button>
            
            <div className="flex-1">
              <select
                value={sandbox.language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full p-2 rounded-md border bg-background"
                disabled={sandbox.isLoading}
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.value} value={lang.value}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-auto">
            <h2 className="text-lg font-medium mb-2">Output</h2>
            <div className="border rounded-md p-3 min-h-[150px] max-h-[300px] overflow-y-auto bg-background whitespace-pre-wrap">
              {sandbox.output || 'Code execution output will appear here...'}
            </div>
          </div>
        </div>
        
        {/* Right Column - Code Editor and Actions */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-medium">Code</h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={sandbox.fileName}
                onChange={handleFileNameChange}
                className="p-1 border rounded text-sm bg-background"
                disabled={sandbox.isLoading}
              />
            </div>
          </div>
          
          <div className="mb-4 flex-1">
            <textarea
              ref={codeRef}
              value={sandbox.code}
              onChange={handleCodeChange}
              placeholder="Generated code will appear here..."
              className="w-full h-[400px] p-3 border rounded-md font-mono text-sm bg-background resize-none"
              disabled={sandbox.isLoading}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={executeCode}
              disabled={!sandbox.code.trim() || sandbox.isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Play size={16} />
              <span>Run Code</span>
            </button>
            
            <button
              onClick={saveCode}
              disabled={!sandbox.code.trim() || sandbox.isLoading}
              className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              <span>Save</span>
            </button>
            
            <button
              onClick={downloadCode}
              disabled={!sandbox.code.trim() || sandbox.isLoading}
              className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Download size={16} />
              <span>Download</span>
            </button>
            
            <button
              onClick={copyCode}
              disabled={!sandbox.code.trim() || sandbox.isLoading}
              className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Copy size={16} />
              <span>Copy</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}