import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useState } from 'react';

export interface Conversation {
  id: number;
  title: string;
  model: string;
  createdAt: string;
}

export function useConversations() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  
  // Get all conversations
  const { data: conversations = [], isLoading, isError } = useQuery({
    queryKey: ['/api/conversations'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Create a new conversation
  const createConversationMutation = useMutation({
    mutationFn: async (model: string) => {
      // Generate a default title with timestamp
      const now = new Date();
      const title = `New conversation (${now.toLocaleTimeString()})`;
      const response = await apiRequest('POST', '/api/conversations', { title, model });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      // Select the newly created conversation
      setSelectedConversationId(data.id);
    },
  });

  // Update a conversation title
  const updateConversationMutation = useMutation({
    mutationFn: async ({ id, title }: { id: number; title: string }) => {
      const response = await apiRequest('PATCH', `/api/conversations/${id}`, { title });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });

  // Delete a conversation
  const deleteConversationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/conversations/${id}`);
      if (selectedConversationId === id) {
        setSelectedConversationId(null);
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });

  return {
    conversations,
    selectedConversationId,
    setSelectedConversationId,
    isLoading,
    isError,
    createNewConversation: createConversationMutation.mutate,
    isCreating: createConversationMutation.isPending,
    updateConversation: updateConversationMutation.mutate,
    isUpdating: updateConversationMutation.isPending,
    deleteConversation: deleteConversationMutation.mutate,
    isDeleting: deleteConversationMutation.isPending,
  };
}