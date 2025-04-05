import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/hooks/use-theme';
import { useGeminiContext } from '@/hooks/use-gemini-context';
import { useToast } from '@/hooks/use-toast';
import { useConversationsContext } from '@/contexts/conversations-context';
import ConversationsList from './conversations-list';

interface SidebarProps {
  activeTab: 'chat' | 'generate' | 'code' | 'liveapi';
}

export default function Sidebar({ activeTab }: SidebarProps) {
  const { toggleDarkMode, isDarkMode } = useTheme();
  const { modelConfig, updateModelConfig, availableModels } = useGeminiContext();
  const { toast } = useToast();
  const { conversations, createConversation, selectedConversation } = useConversationsContext();
  
  interface ApiStatus {
    status: string;
    apiKeyConfigured: boolean;
    apiKeyMasked?: string;
  }
  
  // Query API status
  const { data: apiStatus } = useQuery<ApiStatus>({
    queryKey: ['/api/status'],
    retry: false,
  });

  // Handle creating a new conversation
  const handleNewConversation = () => {
    createConversation("New conversation");
  };

  return (
    <div className="w-64 border-r border-neutral-300 dark:border-neutral-700 flex flex-col flex-shrink-0 h-full bg-white dark:bg-neutral-900">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-neutral-300 dark:border-neutral-800">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white mr-2">
          <span className="material-icons text-sm">smart_toy</span>
        </div>
        <h1 className="font-google-sans text-xl font-medium">PodPlay API Studio</h1>
      </div>
      
      {/* Model Selection Section */}
      <div className="p-4 border-b border-neutral-300 dark:border-neutral-800">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-400 block mb-2">Model</label>
        <div className="relative">
          <select 
            className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md py-2 px-3 text-sm appearance-none"
            value={modelConfig.model}
            onChange={(e) => updateModelConfig({ model: e.target.value })}
          >
            {Object.entries(availableModels).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <span className="material-icons absolute right-2 top-2 text-neutral-500 pointer-events-none">arrow_drop_down</span>
        </div>
      </div>
      
      {/* History Section */}
      <div className="flex flex-col flex-grow overflow-y-auto">
        <div className="px-4 pt-3 pb-2 flex justify-between items-center">
          <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-400">Conversation History</h2>
          <button 
            className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            onClick={handleNewConversation}
          >
            <span className="material-icons text-sm">add</span>
          </button>
        </div>
        
        {/* Conversations List */}
        <ConversationsList />
      </div>
      
      {/* Settings Section */}
      <div className="p-4 border-t border-neutral-300 dark:border-neutral-700 mt-auto">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-400">Dark Mode</span>
          <button 
            className={`w-10 h-5 relative rounded-full ${isDarkMode ? 'bg-primary' : 'bg-neutral-300'}`}
            onClick={toggleDarkMode}
          >
            <span 
              className={`absolute h-4 w-4 ${
                isDarkMode ? 'left-5.5' : 'left-0.5'
              } top-0.5 rounded-full bg-white transition-all duration-200`}
            ></span>
          </button>
        </div>
        
        {/* API Key Status */}
        <div className="text-xs text-neutral-500 mb-3">
          <div className="flex items-center">
            <span className="font-medium mr-1">API Status:</span>
            {apiStatus?.apiKeyConfigured ? (
              <span className="text-green-500 flex items-center">
                <span className="material-icons text-xs mr-1">check_circle</span>
                Active
              </span>
            ) : (
              <span className="text-red-500 flex items-center">
                <span className="material-icons text-xs mr-1">error</span>
                Missing
              </span>
            )}
          </div>
        </div>
        
        <div className="text-xs text-neutral-500 mt-2">
          <a href="https://ai.google.dev/docs" target="_blank" rel="noopener noreferrer" className="hover:text-primary">Documentation</a> •
          <a href="https://ai.google.dev/tutorials/setup" target="_blank" rel="noopener noreferrer" className="hover:text-primary ml-1">Help</a>
        </div>
      </div>
    </div>
  );
}
