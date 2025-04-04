import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useGemini } from '@/hooks/use-gemini';
import { apiRequest } from '@/lib/queryClient';
import MessageInput from './message-input';
import CodeBlock from './ui/code-block';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useWebSocket } from '@/lib/websocket';

export default function CodeView() {
  const { selectedModel, parameters, sendMessageToGemini } = useGemini();
  const [response, setResponse] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [userPrompt, setUserPrompt] = useState<string>('');
  const responseRef = useRef<HTMLDivElement>(null);
  const { socket, isConnected } = useWebSocket();
  
  // Update system instructions specifically for coding tasks
  useEffect(() => {
    const codeSystemInstructions = 
      "You are PodPlay Code Assistant, a specialized AI built to help with programming tasks. " +
      "Focus on providing high-quality, clean code examples with explanations. " +
      "When appropriate, use proper syntax highlighting and structure your responses with clear explanations.";
    
    if (parameters.systemInstructions !== codeSystemInstructions) {
      // Don't update if user has custom instructions
      if (!parameters.systemInstructions || parameters.systemInstructions.includes("PodPlay Assistant")) {
        return;
      }
    }
  }, [parameters.systemInstructions]);
  
  // Set up WebSocket message handler
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    const handleWebSocketMessage = async (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'chunk' && data.content?.parts) {
        // Append text from each part
        const text = data.content.parts
          .filter((part: any) => part.text)
          .map((part: any) => part.text)
          .join('');
        
        setResponse(prev => prev + text);
      }
      else if (data.type === 'done') {
        setIsGenerating(false);
      }
      else if (data.type === 'error') {
        console.error('WebSocket error:', data.error);
        setIsGenerating(false);
        setResponse(prev => prev + `\n\nError: ${data.error}`);
      }
    };
    
    socket.addEventListener('message', handleWebSocketMessage);
    
    return () => {
      socket.removeEventListener('message', handleWebSocketMessage);
    };
  }, [socket, isConnected]);
  
  // Scroll to bottom when response changes
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [response]);
  
  // Handle message submission
  const handleSubmit = async (text: string, files: File[]) => {
    setIsGenerating(true);
    setUserPrompt(text);
    setResponse('');
    
    // Create message content
    const messageContent = [{ type: 'text', text }];
    
    // Send the message to Gemini via WebSocket for streaming
    if (socket && isConnected && parameters.stream) {
      // Add code-focused system instruction
      const codeParameters = {
        ...parameters,
        systemInstructions: parameters.systemInstructions || 
          "You are PodPlay Code Assistant, a specialized AI built to help with programming tasks. " +
          "Focus on providing high-quality, clean code examples with explanations."
      };
      
      socket.send(JSON.stringify({
        type: 'generate',
        stream: true,
        model: selectedModel,
        messages: [{ role: 'user', content: messageContent }],
        parameters: codeParameters
      }));
    } else {
      // Non-streaming fallback
      try {
        // Add code-focused system instruction
        const codeParameters = {
          ...parameters,
          systemInstructions: parameters.systemInstructions || 
            "You are PodPlay Code Assistant, a specialized AI built to help with programming tasks. " +
            "Focus on providing high-quality, clean code examples with explanations."
        };
        
        const response = await sendMessageToGemini(
          selectedModel,
          [{ role: 'user', content: messageContent }],
          codeParameters
        );
        
        if (response && response.candidates && response.candidates[0]?.content) {
          const text = response.candidates[0].content.parts
            .filter((part: any) => part.text)
            .map((part: any) => part.text)
            .join('');
          
          setResponse(text);
        }
      } catch (err: any) {
        setResponse(`Error: ${err.message || 'Failed to generate code'}`);
      } finally {
        setIsGenerating(false);
      }
    }
  };
  
  return (
    <>
      {/* Content Display Area */}
      <div className="flex-grow overflow-y-auto p-4">
        {/* User prompt */}
        {userPrompt && (
          <div className="mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-3">
                <span className="material-icons text-sm text-white">person</span>
              </div>
              <div className="flex-grow">
                <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 font-medium">You</div>
                <div className="text-sm">{userPrompt}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Response content */}
        {(response || isGenerating) && (
          <div className="mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center mr-3">
                <span className="material-icons text-sm text-white">smart_toy</span>
              </div>
              <div className="flex-grow">
                <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 font-medium">PodPlay Code Assistant</div>
                
                {/* Loading indicator */}
                {isGenerating && !response && (
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="h-2 w-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                )}
                
                {/* Rendered markdown response */}
                {response && (
                  <div className="text-sm space-y-3">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          const language = match ? match[1] : '';
                          const code = String(children).replace(/\n$/, '');
                          
                          if (inline) {
                            return <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded font-mono text-sm" {...props}>{children}</code>;
                          }
                          
                          return <CodeBlock language={language} code={code} />;
                        },
                        pre({ children }) {
                          return <>{children}</>;
                        }
                      }}
                    >
                      {response}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Empty state */}
        {!userPrompt && !response && !isGenerating && (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="material-icons text-primary text-2xl">code</span>
            </div>
            <h3 className="text-lg font-google-sans font-medium mb-2">Code Assistant</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center max-w-md">
              Get help with coding tasks, debugging, or learning new programming concepts. Ask for code examples or explanations.
            </p>
          </div>
        )}
        
        <div ref={responseRef} />
      </div>
      
      {/* Input Area */}
      <MessageInput onSubmit={handleSubmit} />
    </>
  );
}
