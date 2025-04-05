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
    <div className="flex h-full">
      {/* Vertical Navigation Tabs */}
      <div className="w-16 border-r border-neutral-300 dark:border-neutral-700 flex flex-col items-center bg-white dark:bg-neutral-900">
        {/* Logo */}
        <div className="w-full p-3 flex justify-center border-b border-neutral-300 dark:border-neutral-800">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white">
            <span className="material-icons text-base">smart_toy</span>
          </div>
        </div>
        
        {/* Vertical Navigation Items */}
        <div className="flex flex-col items-center w-full pt-4 space-y-6">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'chat' }))}
            className={`w-full py-3 flex flex-col items-center justify-center ${
              activeTab === 'chat' 
                ? 'text-primary border-l-4 border-primary' 
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <span className="material-icons mb-1">chat</span>
            <span className="text-xs font-medium">Chat</span>
          </button>
          
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'generate' }))}
            className={`w-full py-3 flex flex-col items-center justify-center ${
              activeTab === 'generate' 
                ? 'text-primary border-l-4 border-primary' 
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <span className="material-icons mb-1">text_fields</span>
            <span className="text-xs font-medium">Generate</span>
          </button>
          
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'code' }))}
            className={`w-full py-3 flex flex-col items-center justify-center ${
              activeTab === 'code' 
                ? 'text-primary border-l-4 border-primary' 
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <span className="material-icons mb-1">code</span>
            <span className="text-xs font-medium">Code</span>
          </button>
          
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'liveapi' }))}
            className={`w-full py-3 flex flex-col items-center justify-center ${
              activeTab === 'liveapi' 
                ? 'text-primary border-l-4 border-primary' 
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <span className="material-icons mb-1">api</span>
            <span className="text-xs font-medium">LiveAPI</span>
          </button>
        </div>
        
        {/* Settings Button */}
        <div className="mt-auto mb-4">
          <button 
            className="p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full"
            onClick={toggleDarkMode}
          >
            <span className="material-icons">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </div>
      </div>
      
      {/* Sidebar Panel */}
      <div className="w-64 border-r border-neutral-300 dark:border-neutral-700 flex flex-col flex-shrink-0 h-full bg-white dark:bg-neutral-900">
        {/* Header */}
        <div className="flex flex-col p-4 border-b border-neutral-300 dark:border-neutral-800">
          <h1 className="font-google-sans text-xl font-medium">PodPlay API Studio</h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">Using {availableModels[modelConfig.model]}</p>
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
        
        {/* API Key Status */}
        <div className="p-4 border-t border-neutral-300 dark:border-neutral-700 mt-auto">
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
    </div>
  );
}
