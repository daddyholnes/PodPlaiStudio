import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function useConversations() {
  const { toast } = useToast();
  
  // Query conversations
  const { 
    data: conversations = [], 
    isLoading: loading,
    isError
  } = useQuery({
    queryKey: ['/api/conversations'],
  });
  
  // Get conversation from localStorage (or null if not found)
  const savedConversationId = localStorage.getItem('selectedConversationId');
  let parsedId = savedConversationId ? parseInt(savedConversationId) : null;
  
  // Create mutations
  const createConversationMutation = useMutation({
    mutationFn: async (data: { title: string; model: string }) => {
      return apiRequest('POST', '/api/conversations', data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      return response.json();
    },
    onError: (error) => {
      toast({
        title: 'Error creating conversation',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  });
  
  const deleteConversationMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/conversations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting conversation',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  });
  
  // Select conversation
  const selectConversation = (id: number) => {
    localStorage.setItem('selectedConversationId', id.toString());
    window.dispatchEvent(new Event('conversationSelected'));
  };
  
  // Create new conversation
  const createNewConversation = async (model: string, title = 'New conversation') => {
    try {
      const response = await createConversationMutation.mutateAsync({ title, model });
      const newConversation = await response.json();
      selectConversation(newConversation.id);
      return newConversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };
  
  // Delete conversation
  const deleteConversation = async (id: number) => {
    // If the conversation being deleted is the selected one, 
    // select a different conversation first
    if (id.toString() === localStorage.getItem('selectedConversationId')) {
      // Find another conversation to select
      const otherConversation = conversations.find(c => c.id !== id);
      if (otherConversation) {
        selectConversation(otherConversation.id);
      } else {
        localStorage.removeItem('selectedConversationId');
        window.dispatchEvent(new Event('conversationSelected'));
      }
    }
    
    await deleteConversationMutation.mutateAsync(id);
  };
  
  // Logic to handle when conversations load
  useEffect(() => {
    if (!loading && !isError && conversations.length > 0) {
      // Check if the selected conversation exists in the list
      if (parsedId !== null) {
        const conversationExists = conversations.some(c => c.id === parsedId);
        if (!conversationExists) {
          // Select the first conversation if the selected one doesn't exist
          parsedId = conversations[0].id;
          localStorage.setItem('selectedConversationId', parsedId.toString());
        }
      } else {
        // No conversation selected, select the first one
        parsedId = conversations[0].id;
        localStorage.setItem('selectedConversationId', parsedId.toString());
      }
    }
  }, [loading, isError, conversations, parsedId]);
  
  return {
    conversations,
    loading,
    selectedConversationId: parsedId,
    selectConversation,
    createNewConversation,
    deleteConversation
  };
}
