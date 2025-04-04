import { useQuery } from '@tanstack/react-query';
import { useConversationsContext } from '@/contexts/conversations-context';
import { Conversation } from '@shared/schema';

export default function ConversationsList() {
  const { 
    conversations, 
    isLoading, 
    selectedConversation, 
    selectConversation, 
    deleteConversation 
  } = useConversationsContext();
  
  // Cast conversations to the Conversation[] type
  const typedConversations = conversations as Conversation[];

  if (isLoading) {
    return (
      <div className="flex-grow p-4 flex flex-col items-center justify-center">
        <div className="animate-pulse flex space-x-2">
          <div className="h-2 w-2 bg-neutral-400 rounded-full"></div>
          <div className="h-2 w-2 bg-neutral-400 rounded-full"></div>
          <div className="h-2 w-2 bg-neutral-400 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (typedConversations.length === 0) {
    return (
      <div className="flex-grow p-4 flex flex-col items-center justify-center">
        <p className="text-sm text-neutral-500 text-center">
          No conversations yet.<br/>Start a new chat to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-grow overflow-y-auto">
      {typedConversations.map((conversation: Conversation) => {
        const isSelected = selectedConversation ? conversation.id === selectedConversation.id : false;
        const icon = conversation.title.toLowerCase().includes('code') ? 'code' : 
                    conversation.title.toLowerCase().includes('generate') ? 'text_fields' : 'chat';
        
        return (
          <div 
            key={conversation.id}
            className={`px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer flex items-center justify-between group ${
              isSelected ? 'bg-neutral-200 dark:bg-neutral-800' : ''
            }`}
            onClick={() => selectConversation(conversation.id)}
          >
            <div className="flex items-center overflow-hidden">
              <span className="material-icons text-neutral-500 mr-2 text-base">{icon}</span>
              <span className="text-sm truncate">{conversation.title}</span>
            </div>
            
            {/* Delete button - only visible on hover or selected */}
            <button
              className={`text-neutral-400 hover:text-error ${isSelected ? '' : 'opacity-0 group-hover:opacity-100'}`}
              onClick={(e) => {
                e.stopPropagation();
                deleteConversation(conversation.id);
              }}
            >
              <span className="material-icons text-sm">delete</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
