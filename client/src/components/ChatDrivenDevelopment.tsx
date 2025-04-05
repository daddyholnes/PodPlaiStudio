import React, { useState, useRef, useEffect } from 'react';
import { useGeminiCodeAssistant } from '@/hooks/use-gemini-code-assistant';
import { useFileSystem } from '@/hooks/use-file-system';
import { apiRequest } from '@/lib/queryClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './ui/code-block';
import { toast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id: string;
}

interface ChatDrivenDevelopmentProps {
  currentFile?: string;
  onCreateFile?: (path: string, content: string) => void;
  onModifyFile?: (path: string, content: string) => void;
  onRunCode?: (path: string) => void;
}

const ChatDrivenDevelopment: React.FC<ChatDrivenDevelopmentProps> = ({
  currentFile,
  onCreateFile,
  onModifyFile,
  onRunCode
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'I\'m your AI programming assistant. I can help you develop code through conversation. Ask me to create files, modify code, or explain concepts.',
      id: 'system-1'
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { generateCode, modifyCode, explainCode } = useGeminiCodeAssistant();
  const { 
    createFile, 
    saveFile, 
    currentFile: activeFile, 
    fileContent, 
    selectFile,
    files
  } = useFileSystem();
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Parse message for code execution commands
  const parseMessageForCommands = async (message: string): Promise<boolean> => {
    // Command patterns
    const createFilePattern = /create\s+(a\s+)?file\s+(?:called\s+|named\s+)?["']?([^"'\s]+)["']?/i;
    const modifyFilePattern = /modify\s+(?:the\s+)?file\s+["']?([^"'\s]+)["']?/i;
    const runFilePattern = /run\s+(?:the\s+)?(?:code\s+in\s+)?["']?([^"'\s]+)["']?/i;
    const installPackagePattern = /install\s+(?:the\s+)?(?:package\s+)?["']?([^"'\s]+)["']?/i;
    
    // Check for file creation request
    const createFileMatch = message.match(createFilePattern);
    if (createFileMatch && onCreateFile) {
      const fileName = createFileMatch[2];
      addAssistantMessage(`I'll help you create a file named "${fileName}". What content would you like to put in this file?`);
      return true;
    }
    
    // Check for file modification request
    const modifyFileMatch = message.match(modifyFilePattern);
    if (modifyFileMatch && onModifyFile) {
      const fileName = modifyFileMatch[1];
      addAssistantMessage(`I'll help you modify "${fileName}". Please tell me what changes you'd like to make.`);
      return true;
    }
    
    // Check for run code request
    const runFileMatch = message.match(runFilePattern);
    if (runFileMatch && onRunCode) {
      const fileName = runFileMatch[1];
      onRunCode(fileName);
      addAssistantMessage(`Running the code in "${fileName}". You should see the output in the terminal.`);
      return true;
    }
    
    // Check for package installation request
    const installPackageMatch = message.match(installPackagePattern);
    if (installPackageMatch) {
      const packageName = installPackageMatch[1];
      addAssistantMessage(`I'll help you install the ${packageName} package. You'll see the installation progress in the terminal.`);
      
      // Simulate package installation in terminal
      try {
        await apiRequest('/api/terminal/execute', 'POST', {
          command: `npm install ${packageName} --save`,
          sessionId: 'current-session' // This would be replaced with the actual terminal session ID
        });
      } catch (error) {
        console.error('Error installing package:', error);
      }
      
      return true;
    }
    
    return false;
  };
  
  // Add a new user message
  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      role: 'user',
      content,
      id: `user-${Date.now()}`
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };
  
  // Add a new assistant message
  const addAssistantMessage = (content: string) => {
    const newMessage: Message = {
      role: 'assistant',
      content,
      id: `assistant-${Date.now()}`
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };
  
  // Handle message submission
  const handleSubmit = async () => {
    if (!input.trim() || isProcessing) return;
    
    const userMessage = input;
    setInput('');
    setIsProcessing(true);
    
    // Add user message to chat
    addUserMessage(userMessage);
    
    // Check if message contains commands
    const isCommand = await parseMessageForCommands(userMessage);
    if (isCommand) {
      setIsProcessing(false);
      return;
    }
    
    try {
      // Detect intent
      let response = '';
      
      if (userMessage.toLowerCase().includes('explain') && activeFile) {
        // Code explanation
        response = await explainCode(fileContent, activeFile.split('.').pop());
      } 
      else if (userMessage.toLowerCase().includes('modify') && activeFile) {
        // Code modification
        const result = await modifyCode(fileContent, userMessage, activeFile.split('.').pop() || '');
        
        if (result.code) {
          // Save the modified code
          await saveFile(activeFile.path, result.code);
          
          response = `I've modified the code in ${activeFile.name}:\n\n\`\`\`${activeFile.split('.').pop()}\n${result.code}\n\`\`\`\n\n${result.explanation || ''}`;
        } else {
          response = "I couldn't modify the code based on your instructions. Could you provide more details?";
        }
      }
      else if (userMessage.toLowerCase().includes('create')) {
        // Generate code for a new file
        const filenameMatch = userMessage.match(/create\s+(?:a\s+)?(?:file|script|program)\s+(?:called|named)?\s*['"]?([a-zA-Z0-9_.-]+)['"]?/i);
        let filename = filenameMatch ? filenameMatch[1] : 'new-file.js';
        
        // Ensure file has an extension
        if (!filename.includes('.')) {
          if (userMessage.toLowerCase().includes('python')) {
            filename += '.py';
          } else if (userMessage.toLowerCase().includes('html')) {
            filename += '.html';
          } else if (userMessage.toLowerCase().includes('css')) {
            filename += '.css';
          } else {
            filename += '.js'; // Default to JavaScript
          }
        }
        
        const result = await generateCode(userMessage, {
          language: filename.split('.').pop(),
          includeExplanation: true
        });
        
        if (result.code) {
          // Create the new file
          const newFile = await createFile(filename, result.code);
          
          if (newFile) {
            // Select the newly created file
            await selectFile(newFile.path);
            
            response = `I've created ${filename} with the following code:\n\n\`\`\`${filename.split('.').pop()}\n${result.code}\n\`\`\`\n\n${result.explanation || ''}`;
          } else {
            response = `I generated code for ${filename}, but couldn't create the file:\n\n\`\`\`${filename.split('.').pop()}\n${result.code}\n\`\`\`\n\n${result.explanation || ''}`;
          }
        } else {
          response = "I couldn't generate code based on your request. Could you provide more details?";
        }
      }
      else {
        // General code assistance
        const result = await generateCode(userMessage, {
          includeExplanation: true
        });
        
        response = result.explanation || '';
        if (result.code) {
          const language = result.language || 'javascript';
          response += `\n\n\`\`\`${language}\n${result.code}\n\`\`\``;
        }
      }
      
      // Add assistant response
      addAssistantMessage(response);
    } catch (error) {
      console.error('Error processing message:', error);
      addAssistantMessage("I'm sorry, I encountered an error while processing your request. Please try again.");
      
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  return (
    <div className="flex flex-col h-full border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden">
      <div className="p-3 border-b border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800">
        <h3 className="text-sm font-medium">Conversation-Driven Development</h3>
      </div>
      
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`
                max-w-[80%] rounded-lg p-3 
                ${message.role === 'user' 
                  ? 'bg-primary text-white' 
                  : message.role === 'system' 
                    ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                    : 'bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200'
                }
              `}
            >
              {message.role === 'assistant' || message.role === 'system' ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const language = match ? match[1] : '';
                      const code = String(children).replace(/\n$/, '');
                      
                      if (inline) {
                        return <code className="bg-neutral-200 dark:bg-neutral-700 px-1 py-0.5 rounded font-mono text-sm" {...props}>{children}</code>;
                      }
                      
                      return <CodeBlock language={language} code={code} />;
                    },
                    pre({ children }) {
                      return <>{children}</>;
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : (
                <div className="whitespace-pre-wrap">{message.content}</div>
              )}
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 border-t border-neutral-300 dark:border-neutral-700">
        <div className="flex items-center space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to create or modify code..."
            className="flex-grow p-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-primary"
            rows={2}
            disabled={isProcessing}
          />
          
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isProcessing}
            className="p-2 bg-primary text-white rounded-md disabled:opacity-50"
          >
            <span className="material-icons">send</span>
          </button>
        </div>
        
        <div className="mt-2 text-xs text-neutral-500">
          Try: "Create a React component for a todo list" or "Modify the current file to add error handling"
        </div>
      </div>
    </div>
  );
};

export default ChatDrivenDevelopment;
