import { useConversationsContext, UseConversationsReturn } from '../contexts/conversations-context';

// Re-export the interface
export type { UseConversationsReturn };

// Re-export the Conversation type
export { type Conversation } from '@shared/schema';

export function useConversations(): UseConversationsReturn {
  // Simply re-export the context hook for compatibility
  return useConversationsContext();
}