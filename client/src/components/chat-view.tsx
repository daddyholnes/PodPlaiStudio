import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useGeminiContext } from '@/hooks/use-gemini-context';
import { useConversations } from '@/hooks/use-conversations';
import { apiRequest, queryClient } from '@/lib/queryClient';
import MessageInput from './message-input';
import CodeBlock from './ui/code-block';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useWebSocket } from '@/hooks/use-websocket';
import { ModelParameters } from '@shared/schema';

export default function ChatView() {
  const { modelConfig } = useGeminiContext();
  const { 
    selectedConversation,
    createConversation
  } = useConversations();
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const websocket = useWebSocket();
  
  // Keep track of pending text to avoid multiple submissions
  const pendingSubmissionRef = useRef<{text: string, files: File[]} | null>(null);
  
  // Extract selected model and parameters from modelConfig
  const selectedModel = modelConfig.model;
  const parameters: ModelParameters = {
    temperature: modelConfig.temperature,
    maxOutputTokens: modelConfig.maxOutputTokens,
    topP: modelConfig.topP,
    topK: modelConfig.topK,
    stream: true,
    systemInstructions: modelConfig.systemInstructions || undefined
  };
  
  // Query for messages in the current conversation
  const { 
    data: messages = [], 
    isLoading 
  } = useQuery({
    queryKey: ['/api/conversations', selectedConversation?.id, 'messages'],
    enabled: !!selectedConversation?.id,
  });
  
  // Mutation for adding a new message
  const addMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/conversations/' + (selectedConversation?.id || 0) + '/messages', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations', selectedConversation?.id, 'messages'] 
      });
    }
  });
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Set up WebSocket message handler
  useEffect(() => {
    if (!websocket.socket || websocket.status !== 'open') return;
    
    const handleWebSocketMessage = async (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'chunk' && data.conversationId === selectedConversation?.id) {
        // Handle message chunk
        queryClient.invalidateQueries({ 
          queryKey: ['/api/conversations', selectedConversation?.id, 'messages'] 
        });
      }
      else if (data.type === 'done') {
        setIsGenerating(false);
      }
      else if (data.type === 'error') {
        console.error('WebSocket error:', data.error);
        setIsGenerating(false);
      }
    };
    
    websocket.socket.addEventListener('message', handleWebSocketMessage);
    
    return () => {
      if (websocket.socket) {
        websocket.socket.removeEventListener('message', handleWebSocketMessage);
      }
    };
  }, [websocket.socket, websocket.status, selectedConversation?.id]);
  
  // Function to send message to Gemini API through REST endpoint
  const sendMessageToGemini = async (model: string, messages: any[], params: ModelParameters) => {
    const response = await apiRequest('/api/gemini/chat', 'POST', {
      model,
      messages,
      parameters: params
    });
    return response;
  };
  
  // Effect to send pending message when conversation is selected
  useEffect(() => {
    // If we have a selected conversation and a pending message, send it
    if (selectedConversation && pendingSubmissionRef.current) {
      const { text, files } = pendingSubmissionRef.current;
      pendingSubmissionRef.current = null; // Clear to prevent duplicate sends
      
      // Small delay to ensure state is fully updated
      setTimeout(() => {
        handleSubmit(text, files);
      }, 100);
    }
  }, [selectedConversation]);
  
  // Handle message submission
  const handleSubmit = async (text: string, files: File[]) => {
    try {
      // Create new conversation if needed
      if (!selectedConversation) {
        const title = text.substring(0, 30) + (text.length > 30 ? '...' : '');
        console.log("Creating new conversation:", title);
        
        // Store the text and files for later use
        pendingSubmissionRef.current = { text, files };
        
        await createConversation(title);
        // The effect for selectedConversation change will handle sending the message
        return;
      }
      
      console.log("Sending message to conversation:", selectedConversation.id);
      setIsGenerating(true);
      
      // Process image files
      const processedFiles = await Promise.all(
        files.map(async (file) => {
          if (file.type.startsWith('image/')) {
            return new Promise<{ type: 'image', mimeType: string, fileData: string }>((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                resolve({
                  type: 'image',
                  mimeType: file.type,
                  fileData: e.target?.result as string
                });
              };
              reader.readAsDataURL(file);
            });
          }
          return null;
        })
      );
      
      // Create user message content parts
      const userMessageParts = [
        { type: 'text' as const, text },
        ...processedFiles.filter(Boolean) as any[]
      ];
      
      // Save user message to the conversation
      await addMessageMutation.mutateAsync({
        role: 'user',
        content: userMessageParts
      });
      
      // Get all messages for context
      const updatedMessages = await queryClient.fetchQuery({
        queryKey: ['/api/conversations', selectedConversation.id, 'messages']
      }) as any[];
      
      // Send the message to Gemini via WebSocket for streaming
      if (websocket.socket && websocket.status === 'open' && parameters.stream) {
        websocket.sendMessage(JSON.stringify({
          type: 'generate',
          stream: true,
          model: selectedModel,
          messages: updatedMessages.map((msg: any) => ({
            role: msg.role,
            content: msg.content
          })),
          parameters,
          conversationId: selectedConversation.id
        }));
        
        // Create empty assistant message to start streaming
        await addMessageMutation.mutateAsync({
          role: 'assistant',
          content: [{ type: 'text', text: '' }]
        });
      } else {
        // Non-streaming fallback
        try {
          const response = await sendMessageToGemini(
            selectedModel,
            updatedMessages.map((msg: any) => ({
              role: msg.role,
              content: msg.content
            })),
            parameters
          ) as any;
          
          if (response && response.candidates && response.candidates[0]?.content) {
            const assistantContent = response.candidates[0].content.parts.map((part: any) => {
              if (part.text) {
                return { type: 'text', text: part.text };
              }
              return null;
            }).filter(Boolean);
            
            await addMessageMutation.mutateAsync({
              role: 'assistant',
              content: assistantContent.length ? assistantContent : [{ type: 'text', text: 'No response generated.' }]
            });
          }
        } catch (err) {
          console.error('Error sending message:', err);
        } finally {
          setIsGenerating(false);
        }
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setIsGenerating(false);
    }
  };
  
  // Render message content with proper formatting
  const renderMessageContent = (content: any[]) => {
    return content.map((part, idx) => {
      if (part.type === 'text') {
        // Use markdown rendering with code block support
        return (
          <ReactMarkdown
            key={idx}
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                const code = String(children).replace(/\n$/, '');
                
                if ((props as any).inline) {
                  return <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded font-mono text-sm" {...props}>{children}</code>;
                }
                
                return <CodeBlock language={language} code={code} />;
              },
              pre({ children }) {
                return <>{children}</>;
              }
            }}
          >
            {part.text}
          </ReactMarkdown>
        );
      } else if (part.type === 'image' && part.fileData) {
        return (
          <div key={idx} className="my-2">
            <img 
              src={part.fileData} 
              alt={part.fileName || 'Uploaded image'} 
              className="max-w-full max-h-80 rounded-lg"
            />
          </div>
        );
      }
      return null;
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  const typedMessages = messages as any[];
  
  return (
    <>
      {/* Conversation Display Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-6" id="conversation-container">
        {/* System Message */}
        <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3 border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center mr-3">
              <span className="material-icons text-sm text-neutral-600 dark:text-neutral-400">settings</span>
            </div>
            <div className="flex-grow">
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 font-medium">System</div>
              <div className="text-sm">
                {parameters.systemInstructions || 
                  'You are PodPlay Assistant, a helpful AI built to assist with coding, content generation, and answering questions.'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Conversation Messages */}
        {typedMessages.map((message: any) => {
          const isUser = message.role === 'user';
          const isSystem = message.role === 'system';
          
          return (
            <div key={message.id} className="flex items-start">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                isUser ? 'bg-primary' : 
                isSystem ? 'bg-neutral-200 dark:bg-neutral-700' : 
                'bg-secondary'
              }`}>
                <span className={`material-icons text-sm ${
                  isUser || !isSystem ? 'text-white' : 'text-neutral-600 dark:text-neutral-400'
                }`}>
                  {isUser ? 'person' : isSystem ? 'settings' : 'smart_toy'}
                </span>
              </div>
              <div className="flex-grow">
                <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                  {isUser ? 'You' : isSystem ? 'System' : 'PodPlay Assistant'}
                </div>
                <div className="text-sm space-y-3">
                  {renderMessageContent(message.content)}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Loading indicator when generating */}
        {isGenerating && (
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center mr-3">
              <span className="material-icons text-sm text-white">smart_toy</span>
            </div>
            <div className="flex-grow">
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                PodPlay Assistant
              </div>
              <div className="flex space-x-1">
                <div className="h-2 w-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce"></div>
                <div className="h-2 w-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="h-2 w-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Empty state when no messages */}
        {typedMessages.length === 0 && !isGenerating && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="material-icons text-primary text-2xl">chat</span>
            </div>
            <h3 className="text-lg font-google-sans font-medium mb-2">Start a new conversation</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center max-w-md">
              Ask a question, request information, or start a dialogue with PodPlay Assistant.
            </p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <MessageInput onSubmit={handleSubmit} />
    </>
  );
}
