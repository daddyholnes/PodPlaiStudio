import { useContext } from 'react';
import { ConversationsContext } from '@/contexts/conversations-context';

// Define the Conversation type
export type Conversation = {
  id: number;
  title: string;
  model: string;
  createdAt: string;
};

export function useConversations() {
  const context = useContext(ConversationsContext);
  
  if (!context) {
    throw new Error('useConversations must be used within a ConversationsProvider');
  }
  
  return context;
}