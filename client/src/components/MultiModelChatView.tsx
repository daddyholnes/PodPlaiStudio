import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import MultiModelConversationManager from './MultiModelConversationManager';
import ModelSelectionPanel from './ModelSelectionPanel';
import { useLocalStorage } from '../hooks/use-local-storage';

export default function MultiModelChatView() {
  // State for active tab in the sidebar
  const [activeTab, setActiveTab] = useState<'chat' | 'models' | 'settings'>('chat');
  
  return (
    <div className="flex h-full">
      {/* Left sidebar for conversation management */}
      <div className="w-64 border-r border-neutral-300 dark:border-neutral-700 flex flex-col h-full">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="h-full flex flex-col">
          <TabsList className="grid grid-cols-3 mx-2 mt-2">
            <TabsTrigger value="chat" className="text-xs">
              <span className="material-icons text-sm mr-1">forum</span>
              Chats
            </TabsTrigger>
            <TabsTrigger value="models" className="text-xs">
              <span className="material-icons text-sm mr-1">smart_toy</span>
              Models
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              <span className="material-icons text-sm mr-1">settings</span>
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="flex-grow overflow-hidden flex flex-col">
            <MultiModelConversationManager />
          </TabsContent>
          
          <TabsContent value="models" className="flex-grow overflow-hidden flex flex-col">
            <ModelSelectionPanel />
          </TabsContent>
          
          <TabsContent value="settings" className="flex-grow overflow-hidden flex flex-col p-4">
            <h2 className="text-lg font-medium mb-4">Multi-Model Chat Settings</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Default Behavior</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="auto-respond" className="text-sm">Auto-respond to other models</label>
                    <input 
                      id="auto-respond"
                      type="checkbox" 
                      className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-700 text-primary focus:ring-primary"
                      aria-label="Auto-respond to other models"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label htmlFor="show-thinking" className="text-sm">Show model thinking</label>
                    <input 
                      id="show-thinking"
                      type="checkbox" 
                      className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-700 text-primary focus:ring-primary"
                      aria-label="Show model thinking"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label htmlFor="thread-view" className="text-sm">Thread view for responses</label>
                    <input 
                      id="thread-view"
                      type="checkbox" 
                      className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-700 text-primary focus:ring-primary"
                      aria-label="Thread view for responses"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Interface</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="compact-view" className="text-sm">Compact message view</label>
                    <input 
                      id="compact-view"
                      type="checkbox" 
                      className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-700 text-primary focus:ring-primary"
                      aria-label="Compact message view"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label htmlFor="show-avatars" className="text-sm">Show model avatars</label>
                    <input 
                      id="show-avatars"
                      type="checkbox" 
                      className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-700 text-primary focus:ring-primary"
                      defaultChecked
                      aria-label="Show model avatars"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Advanced</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="model-comparison" className="text-sm">Enable model comparison</label>
                    <input 
                      id="model-comparison"
                      type="checkbox" 
                      className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-700 text-primary focus:ring-primary"
                      defaultChecked
                      aria-label="Enable model comparison"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label htmlFor="save-separately" className="text-sm">Save model responses separately</label>
                    <input 
                      id="save-separately"
                      type="checkbox" 
                      className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-700 text-primary focus:ring-primary"
                      aria-label="Save model responses separately"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Main chat area */}
      <div className="flex-grow flex flex-col h-full">
        <div className="border-b border-neutral-300 dark:border-neutral-700 p-3 flex items-center justify-between">
          <h2 className="font-medium">Multi-Model Chat</h2>
          <div className="flex items-center space-x-2">
            <button className="p-1 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
              <span className="material-icons text-sm">help_outline</span>
            </button>
            <button className="p-1 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
              <span className="material-icons text-sm">more_vert</span>
            </button>
          </div>
        </div>
        
        <div className="flex-grow flex flex-col p-4 overflow-y-auto">
          {/* Empty state */}
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="material-icons text-primary text-2xl">forum</span>
            </div>
            <h3 className="text-lg font-medium mb-2">Multi-Model Chat</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-md mb-6">
              Chat with multiple AI models simultaneously. Compare responses, ask follow-up questions, and see how different models approach the same problem.
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm flex items-center">
                <span className="material-icons text-sm mr-1">add</span>
                New Conversation
              </button>
              <button className="border border-neutral-300 dark:border-neutral-700 px-4 py-2 rounded-lg text-sm flex items-center">
                <span className="material-icons text-sm mr-1">smart_toy</span>
                Configure Models
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
