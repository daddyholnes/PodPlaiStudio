import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useGemini } from '@/hooks/use-gemini';
import { apiRequest } from '@/lib/queryClient';
import MessageInput from './message-input';
import CodeBlock from './ui/code-block';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useWebSocket } from '@/lib/websocket';

export default function GenerateView() {
  const { selectedModel, parameters, sendMessageToGemini } = useGemini();
  const [response, setResponse] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [userFiles, setUserFiles] = useState<any[]>([]);
  const responseRef = useRef<HTMLDivElement>(null);
  const { socket, isConnected } = useWebSocket();
  
  // Mutation for file upload
  const fileUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      return response.json();
    }
  });
  
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
    
    // Process image files if any
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        if (file.type.startsWith('image/')) {
          try {
            const uploadResult = await fileUploadMutation.mutateAsync(file);
            return {
              type: 'image',
              mimeType: file.type,
              fileData: uploadResult.fileData
            };
          } catch (error) {
            console.error('File upload error:', error);
            return null;
          }
        }
        return null;
      })
    );
    
    // Filter out null values and set user files
    const validFiles = processedFiles.filter(Boolean) as any[];
    setUserFiles(validFiles);
    
    // Create message content parts
    const messageParts = [
      { type: 'text', text },
      ...validFiles
    ];
    
    // Send the message to Gemini via WebSocket for streaming
    if (socket && isConnected && parameters.stream) {
      socket.send(JSON.stringify({
        type: 'generate',
        stream: true,
        model: selectedModel,
        messages: [{ role: 'user', content: messageParts }],
        parameters
      }));
    } else {
      // Non-streaming fallback
      try {
        const response = await sendMessageToGemini(
          selectedModel,
          [{ role: 'user', content: messageParts }],
          parameters
        );
        
        if (response && response.candidates && response.candidates[0]?.content) {
          const text = response.candidates[0].content.parts
            .filter((part: any) => part.text)
            .map((part: any) => part.text)
            .join('');
          
          setResponse(text);
        }
      } catch (err: any) {
        setResponse(`Error: ${err.message || 'Failed to generate content'}`);
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
                
                {/* Render uploaded images */}
                {userFiles.map((file, index) => (
                  file.type === 'image' && (
                    <div key={index} className="mt-2">
                      <img 
                        src={file.fileData} 
                        alt="Uploaded image" 
                        className="max-w-full max-h-60 rounded-lg" 
                      />
                    </div>
                  )
                ))}
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
                <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 font-medium">PodPlay Assistant</div>
                
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
              <span className="material-icons text-primary text-2xl">text_fields</span>
            </div>
            <h3 className="text-lg font-google-sans font-medium mb-2">Generate Content</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center max-w-md">
              Generate blog posts, descriptions, summaries, or other text-based content using PodPlay Assistant.
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
