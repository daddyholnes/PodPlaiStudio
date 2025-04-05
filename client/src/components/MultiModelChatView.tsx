import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useGeminiContext } from '../hooks/use-gemini-context';
import { useConversations } from '../hooks/use-conversations';
import { apiRequest, queryClient } from '../lib/queryClient';
import MessageInput from './message-input';
import CodeBlock from './ui/code-block';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useWebSocket } from '../hooks/use-websocket';
import { ModelParameters } from '@shared/schema';
import { useLocalStorage } from '../hooks/use-local-storage';
import { toast } from '../hooks/use-toast';

// Define model types
interface Model {
  id: string;
  name: string;
  provider: 'gemini' | 'claude' | 'custom';
  avatar?: string;
  enabled: boolean;
  autoRespond: boolean;
  parameters: ModelParameters;
}

// Default models configuration
const DEFAULT_MODELS: Model[] = [
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'gemini',
    enabled: true,
    autoRespond: true,
    parameters: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      topP: 0.95,
      topK: 40,
      stream: true
    }
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'claude',
    enabled: false,
    autoRespond: false,
    parameters: {
      temperature: 0.5,
      maxOutputTokens: 4096,
      topP: 0.9,
      stream: true
    }
  }
];

export default function MultiModelChatView() {
  // Get models from local storage or use defaults
  const [models, setModels] = useLocalStorage<Model[]>('multi-model-chat-models', DEFAULT_MODELS);
  
  // Track which model is currently responding
  const [respondingModel, setRespondingModel] = useState<string | null>(null);
  
  // Track which models are currently thinking
  const [thinkingModels, setThinkingModels] = useState<string[]>([]);
  
  // Track if any model is generating a response
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Reference to scroll to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get conversation context
  const { 
    selectedConversation,
    createConversation
  } = useConversations();
  
  // Get WebSocket connection
  const websocket = useWebSocket();
  
  // Keep track of pending text to avoid multiple submissions
  const pendingSubmissionRef = useRef<{text: string, files: File[], targetModel?: string} | null>(null);
  
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
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received:", data);
        
        if (data.type === 'chunk' && data.conversationId === selectedConversation?.id) {
          // Handle message chunk - force refetch all messages to get the updated content
          await queryClient.invalidateQueries({ 
            queryKey: ['/api/conversations', selectedConversation?.id, 'messages'] 
          });
          // Force a refetch to ensure we have the latest data
          await queryClient.refetchQueries({
            queryKey: ['/api/conversations', selectedConversation?.id, 'messages']
          });
        }
        else if (data.type === 'done') {
          console.log("Message generation complete");
          setRespondingModel(null);
          
          // Remove model from thinking list
          if (data.modelId) {
            setThinkingModels(prev => prev.filter(id => id !== data.modelId));
          }
          
          // Check if any models are still thinking
          if (thinkingModels.length <= 1) {
            setIsGenerating(false);
          }
          
          // Final refetch to get the complete message
          await queryClient.invalidateQueries({ 
            queryKey: ['/api/conversations', selectedConversation?.id, 'messages'] 
          });
          
          // If auto-respond is enabled for other models, trigger their responses
          if (data.modelId && !data.targetModel) {
            triggerAutoResponses(data.modelId);
          }
        }
        else if (data.type === 'model_thinking') {
          // Add model to thinking list
          if (data.modelId && !thinkingModels.includes(data.modelId)) {
            setThinkingModels(prev => [...prev, data.modelId]);
          }
        }
        else if (data.type === 'error') {
          console.error('WebSocket error:', data.error);
          setRespondingModel(null);
          
          // Remove model from thinking list
          if (data.modelId) {
            setThinkingModels(prev => prev.filter(id => id !== data.modelId));
          }
          
          // Check if any models are still thinking
          if (thinkingModels.length <= 1) {
            setIsGenerating(false);
          }
          
          toast({
            title: 'Error',
            description: `Error from ${data.modelId || 'AI model'}: ${data.error}`,
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
      }
    };
    
    websocket.socket.addEventListener('message', handleWebSocketMessage);
    
    return () => {
      if (websocket.socket) {
        websocket.socket.removeEventListener('message', handleWebSocketMessage);
      }
    };
  }, [websocket.socket, websocket.status, selectedConversation?.id, queryClient, thinkingModels]);
  
  // Function to send message to AI model through REST endpoint
  const sendMessageToModel = async (modelId: string, messages: any[], params: ModelParameters, targetModel?: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return null;
    
    const endpoint = model.provider === 'claude' 
      ? '/api/claude/chat' 
      : '/api/gemini/chat';
    
    const response = await apiRequest(endpoint, 'POST', {
      model: modelId,
      messages,
      parameters: params,
      targetModel
    });
    
    return response;
  };
  
  // Trigger auto-responses from other models
  const triggerAutoResponses = async (respondedModelId: string) => {
    if (!selectedConversation) return;
    
    // Get all enabled models that have auto-respond enabled
    const autoRespondModels = models.filter(
      model => model.enabled && model.autoRespond && model.id !== respondedModelId
    );
    
    if (autoRespondModels.length === 0) return;
    
    // Get all messages for context
    const updatedMessages = await queryClient.fetchQuery({
      queryKey: ['/api/conversations', selectedConversation.id, 'messages']
    }) as any[];
    
    // Trigger responses from each auto-respond model
    for (const model of autoRespondModels) {
      console.log(`Triggering auto-response from ${model.name}`);
      
      // Add model to thinking list
      setThinkingModels(prev => [...prev, model.id]);
      setIsGenerating(true);
      
      // Send the message via WebSocket for streaming
      if (websocket.socket && websocket.status === 'open' && model.parameters.stream) {
        websocket.sendMessage(JSON.stringify({
          type: 'chat',
          stream: true,
          model: model.id,
          messages: updatedMessages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            modelId: msg.modelId
          })),
          parameters: model.parameters,
          conversationId: selectedConversation.id,
          modelId: model.id,
          isAutoResponse: true
        }));
        
        // Create empty assistant message to start streaming
        await addMessageMutation.mutateAsync({
          role: 'assistant',
          content: [{ type: 'text', text: '' }],
          modelId: model.id
        });
      } else {
        // Non-streaming fallback
        try {
          const response = await sendMessageToModel(
            model.id,
            updatedMessages.map((msg: any) => ({
              role: msg.role,
              content: msg.content,
              modelId: msg.modelId
            })),
            model.parameters
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
              content: assistantContent.length ? assistantContent : [{ type: 'text', text: 'No response generated.' }],
              modelId: model.id
            });
          }
        } catch (err) {
          console.error(`Error getting auto-response from ${model.name}:`, err);
        } finally {
          setThinkingModels(prev => prev.filter(id => id !== model.id));
        }
      }
    }
  };
  
  // Effect to send pending message when conversation is selected
  useEffect(() => {
    // If we have a selected conversation and a pending message, send it
    if (selectedConversation && pendingSubmissionRef.current) {
      console.log("Selected conversation updated, sending pending message", 
        selectedConversation.id, pendingSubmissionRef.current.text.substring(0, 30));
      
      const { text, files, targetModel } = pendingSubmissionRef.current;
      pendingSubmissionRef.current = null; // Clear to prevent duplicate sends
      
      // Small delay to ensure state is fully updated
      setTimeout(() => {
        try {
          handleSubmit(text, files, targetModel);
        } catch (error) {
          console.error("Error sending pending message:", error);
        }
      }, 300); // Increased delay to ensure state fully propagates
    }
  }, [selectedConversation]);
  
  // Handle message submission
  const handleSubmit = async (text: string, files: File[], targetModel?: string) => {
    try {
      // Create new conversation if needed
      if (!selectedConversation) {
        const title = text.substring(0, 30) + (text.length > 30 ? '...' : '');
        console.log("Creating new conversation:", title);
        
        // Store the text and files for later use
        pendingSubmissionRef.current = { text, files, targetModel };
        
        try {
          const newConversation = await createConversation(title);
          console.log("New conversation created:", newConversation);
        } catch (err) {
          console.error("Failed to create conversation:", err);
          pendingSubmissionRef.current = null; // Clear pending submission on error
          return;
        }
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
        content: userMessageParts,
        targetModel
      });
      
      // Get all messages for context
      const updatedMessages = await queryClient.fetchQuery({
        queryKey: ['/api/conversations', selectedConversation.id, 'messages']
      }) as any[];
      
      // If a specific model is targeted, only send to that model
      if (targetModel) {
        const model = models.find(m => m.id === targetModel);
        if (!model || !model.enabled) {
          toast({
            title: 'Model Unavailable',
            description: `The selected model "${targetModel}" is not available.`,
            variant: 'destructive'
          });
          setIsGenerating(false);
          return;
        }
        
        await sendToModel(model, updatedMessages, targetModel);
        return;
      }
      
      // Otherwise, send to all enabled models
      const enabledModels = models.filter(model => model.enabled);
      if (enabledModels.length === 0) {
        toast({
          title: 'No Models Enabled',
          description: 'Please enable at least one AI model in the settings.',
          variant: 'destructive'
        });
        setIsGenerating(false);
        return;
      }
      
      // Send to the first enabled model
      const primaryModel = enabledModels[0];
      await sendToModel(primaryModel, updatedMessages);
      
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setIsGenerating(false);
    }
  };
  
  // Helper function to send message to a specific model
  const sendToModel = async (model: Model, messages: any[], targetModel?: string) => {
    console.log(`Sending message to ${model.name}`);
    setRespondingModel(model.id);
    setThinkingModels(prev => [...prev, model.id]);
    
    // Send the message via WebSocket for streaming
    if (websocket.socket && websocket.status === 'open' && model.parameters.stream) {
      websocket.sendMessage(JSON.stringify({
        type: 'chat',
        stream: true,
        model: model.id,
        messages: messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          modelId: msg.modelId,
          targetModel: msg.targetModel
        })),
        parameters: model.parameters,
        conversationId: selectedConversation!.id,
        modelId: model.id,
        targetModel
      }));
      
      // Create empty assistant message to start streaming
      await addMessageMutation.mutateAsync({
        role: 'assistant',
        content: [{ type: 'text', text: '' }],
        modelId: model.id,
        targetModel
      });
    } else {
      // Non-streaming fallback
      try {
        const response = await sendMessageToModel(
          model.id,
          messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            modelId: msg.modelId,
            targetModel: msg.targetModel
          })),
          model.parameters,
          targetModel
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
            content: assistantContent.length ? assistantContent : [{ type: 'text', text: 'No response generated.' }],
            modelId: model.id,
            targetModel
          });
        }
      } catch (err) {
        console.error(`Error getting response from ${model.name}:`, err);
        toast({
          title: 'Error',
          description: `Failed to get response from ${model.name}.`,
          variant: 'destructive'
        });
      } finally {
        setRespondingModel(null);
        setThinkingModels(prev => prev.filter(id => id !== model.id));
        setIsGenerating(false);
      }
    }
  };
  
  // Toggle model enabled state
  const toggleModelEnabled = (modelId: string) => {
    setModels(prevModels => 
      prevModels.map(model => 
        model.id === modelId 
          ? { ...model, enabled: !model.enabled } 
          : model
      )
    );
  };
  
  // Toggle model auto-respond state
  const toggleModelAutoRespond = (modelId: string) => {
    setModels(prevModels => 
      prevModels.map(model => 
        model.id === modelId 
          ? { ...model, autoRespond: !model.autoRespond } 
          : model
      )
    );
  };
  
  // Get model name by ID
  const getModelName = (modelId: string): string => {
    const model = models.find(m => m.id === modelId);
    return model ? model.name : modelId;
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
  
  // Get model color based on provider
  const getModelColor = (modelId: string): string => {
    const model = models.find(m => m.id === modelId);
    if (!model) return 'bg-secondary';
    
    switch (model.provider) {
      case 'gemini':
        return 'bg-blue-600';
      case 'claude':
        return 'bg-purple-600';
      case 'custom':
        return 'bg-green-600';
      default:
        return 'bg-secondary';
    }
  };
  
  // Get model icon based on provider
  const getModelIcon = (modelId: string): string => {
    const model = models.find(m => m.id === modelId);
    if (!model) return 'smart_toy';
    
    switch (model.provider) {
      case 'gemini':
        return 'auto_awesome';
      case 'claude':
        return 'psychology';
      case 'custom':
        return 'settings_applications';
      default:
        return 'smart_toy';
    }
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
      {/* Model Selection Bar */}
      <div className="border-b border-neutral-300 dark:border-neutral-700 p-2 flex items-center space-x-2 overflow-x-auto">
        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mr-2">Models:</span>
        
        {models.map(model => (
          <div key={model.id} className="flex items-center space-x-1">
            <button
              className={`px-2 py-1 rounded text-xs flex items-center ${
                model.enabled 
                  ? `${getModelColor(model.id)} text-white` 
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}
              onClick={() => toggleModelEnabled(model.id)}
              title={model.enabled ? 'Disable model' : 'Enable model'}
            >
              <span className="material-icons text-xs mr-1">{getModelIcon(model.id)}</span>
              {model.name}
            </button>
            
            <button
              className={`p-1 rounded ${
                model.autoRespond && model.enabled
                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' 
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-500'
              }`}
              onClick={() => toggleModelAutoRespond(model.id)}
              disabled={!model.enabled}
              title={model.autoRespond ? 'Disable auto-respond' : 'Enable auto-respond'}
            >
              <span className="material-icons text-xs">
                {model.autoRespond ? 'autorenew' : 'pause'}
              </span>
            </button>
          </div>
        ))}
      </div>
      
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
                This is a multi-model chat. You can interact with multiple AI models simultaneously.
                {models.filter(m => m.enabled).length === 0 && (
                  <div className="mt-2 text-amber-600 dark:text-amber-400">
                    Warning: No models are currently enabled. Enable at least one model to start chatting.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Conversation Messages */}
        {typedMessages.map((message: any) => {
          const isUser = message.role === 'user';
          const isSystem = message.role === 'system';
          const modelId = message.modelId;
          const targetModel = message.targetModel;
          
          return (
            <div key={message.id} className="flex items-start">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                isUser ? 'bg-primary' : 
                isSystem ? 'bg-neutral-200 dark:bg-neutral-700' : 
                getModelColor(modelId)
              }`}>
                <span className="material-icons text-sm text-white">
                  {isUser ? 'person' : isSystem ? 'settings' : getModelIcon(modelId)}
                </span>
              </div>
              <div className="flex-grow">
                <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 font-medium flex items-center">
                  {isUser ? 'You' : isSystem ? 'System' : getModelName(modelId)}
                  
                  {targetModel && (
                    <span className="ml-2 text-xs bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded-full flex items-center">
                      <span className="material-icons text-xs mr-0.5">arrow_forward</span>
                      {getModelName(targetModel)}
                    </span>
                  )}
                </div>
                <div className="text-sm space-y-3">
                  {renderMessageContent(message.content)}
                </div>
                
                {/* Model response buttons */}
                {isUser && models.filter(m => m.enabled).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {models.filter(m => m.enabled).map(model => (
                      <button
                        key={model.id}
                        className={`text-xs px-2 py-0.5 rounded-full flex items-center ${getModelColor(model.id)} text-white opacity-70 hover:opacity-100`}
                        onClick={() => handleSubmit(`@${getModelName(model.id)} Please respond to this message.`, [], model.id)}
                      >
                        <span className="material-icons text-xs mr-1">{getModelIcon(model.id)}</span>
                        Ask {model.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Loading indicators for thinking models */}
        {thinkingModels.map(modelId => (
          <div key={modelId} className="flex items-start">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${getModelColor(modelId)}`}>
              <span className="material-icons text-sm text-white">{getModelIcon(modelId)}</span>
            </div>
            <div className="flex-grow">
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                {getModelName(modelId)}
              </div>
              <div className="flex space-x-1">
                <div className="h-2 w-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce"></div>
                <div className="h-2 w-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="h-2 w-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Empty state when no messages */}
        {typedMessages.length === 0 && thinkingModels.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="material-icons text-primary text-2xl">forum</span>
            </div>
            <h3 className="text-lg font-google-sans font-medium mb-2">Start a multi-model conversation</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center max-w-md">
              Ask a question and get responses from multiple AI models. Compare their answers and insights.
            </p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <MessageInput 
        onSubmit={handleSubmit} 
        placeholder="Message all models or use @ModelName to target a specific model..."
      />
    </>
  );
}
