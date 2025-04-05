import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { Conversation } from '@shared/schema';
import { useWebSocket } from '../hooks/use-websocket';
import { WebSocketMessageType } from '../lib/websocket';

// Define interface for the hook return value
export interface UseConversationsReturn {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  isLoading: boolean;
  error: Error | null;
  createConversation: (title: string) => Promise<Conversation>;
  selectConversation: (id: number) => void;
  updateConversation: (id: number, title: string) => Promise<Conversation | undefined>;
  deleteConversation: (id: number) => Promise<boolean>;
}

// Create context with a default value
const ConversationsContext = createContext<UseConversationsReturn | null>(null);

// Create a provider component
export function ConversationsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  
  // Set up WebSocket for real-time conversation updates
  const { status, sendMessage } = useWebSocket({
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === WebSocketMessageType.CONVERSATIONS) {
          // Update the conversations cache with the latest conversations
          queryClient.setQueryData(['/api/conversations'], data.conversations);
        } else if (data.type === WebSocketMessageType.NEW_CONVERSATION) {
          // Invalidate the conversations query to trigger a refetch
          queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
          
          // If a new conversation is created, select it
          if (data.conversation) {
            setSelectedConversation(data.conversation);
          }
        } else if (data.type === WebSocketMessageType.DELETE_CONVERSATION) {
          // Invalidate the conversations query to trigger a refetch
          queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
          
          // If the deleted conversation is the selected one, deselect it
          if (selectedConversation && selectedConversation.id === data.conversationId) {
            setSelectedConversation(null);
          }
        } else if (data.type === WebSocketMessageType.UPDATE_CONVERSATION) {
          // Invalidate the conversations query to trigger a refetch
          queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
          
          // If the updated conversation is the selected one, update it
          if (selectedConversation && selectedConversation.id === data.conversation.id) {
            setSelectedConversation(data.conversation);
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  });
  
  // Fetch conversations
  const { data, isLoading, error } = useQuery<Conversation[], Error>({
    queryKey: ['/api/conversations'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: true,
  });
  
  // Create a new conversation
  const createConversation = useCallback(async (title: string): Promise<Conversation> => {
    // Default model from app settings if available
    const model = 'gemini-1.5-pro'; // Default model
    const newConversation = await apiRequest('/api/conversations', 'POST', { 
      title,
      model
    }) as Conversation;
    queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    setSelectedConversation(newConversation);
    return newConversation;
  }, [queryClient]);
  
  // Select a conversation
  const selectConversation = useCallback((id: number) => {
    const conversation = data?.find(c => c.id === id) || null;
    setSelectedConversation(conversation);
  }, [data]);
  
  // Update a conversation
  const updateConversation = useCallback(async (id: number, title: string): Promise<Conversation | undefined> => {
    const updatedConversation = await apiRequest(`/api/conversations/${id}`, 'PATCH', { title }) as Conversation;
    queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    
    // If the updated conversation is the selected one, update it
    if (selectedConversation && selectedConversation.id === id) {
      setSelectedConversation(updatedConversation);
    }
    
    return updatedConversation;
  }, [queryClient, selectedConversation]);
  
  // Delete a conversation
  const deleteConversation = useCallback(async (id: number): Promise<boolean> => {
    const success = await apiRequest(`/api/conversations/${id}`, 'DELETE') as boolean;
    queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    
    // If the deleted conversation is the selected one, deselect it
    if (selectedConversation && selectedConversation.id === id) {
      setSelectedConversation(null);
    }
    
    return success;
  }, [queryClient, selectedConversation]);
  
  // Effect to select the first conversation if there is no selected conversation
  useEffect(() => {
    if (!selectedConversation && data && data.length > 0) {
      setSelectedConversation(data[0]);
    }
  }, [data, selectedConversation]);
  
  const contextValue = {
    conversations: data || [],
    selectedConversation,
    isLoading,
    error,
    createConversation,
    selectConversation,
    updateConversation,
    deleteConversation
  };
  
  return (
    <ConversationsContext.Provider value={contextValue}>
      {children}
    </ConversationsContext.Provider>
  );
}

// Create a hook to use the context
export function useConversationsContext(): UseConversationsReturn {
  const context = useContext(ConversationsContext);
  
  if (!context) {
    throw new Error('useConversationsContext must be used within a ConversationsProvider');
  }
  
  return context;
}