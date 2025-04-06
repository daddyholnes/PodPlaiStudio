import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/use-local-storage';
import { useConversations } from '../hooks/use-conversations';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '../lib/queryClient';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { toast } from '../hooks/use-toast';

// Define conversation types
interface MultiModelConversation {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  isMultiModel: boolean;
  turnTaking: boolean;
  activeModels: string[];
  threadView: boolean;
}

// Default conversation settings
const DEFAULT_SETTINGS = {
  isMultiModel: true,
  turnTaking: false,
  activeModels: ['gemini-pro'],
  threadView: false
};

export default function MultiModelConversationManager() {
  // Get conversation context
  const { 
    conversations,
    selectedConversation,
    selectConversation,
    createConversation,
    deleteConversation,
    updateConversationTitle
  } = useConversations();
  
  // Get multi-model conversation settings from local storage
  const [conversationSettings, setConversationSettings] = useLocalStorage<Record<number, {
    isMultiModel: boolean;
    turnTaking: boolean;
    activeModels: string[];
    threadView: boolean;
  }>>('multi-model-conversation-settings', {});
  
  // State for conversation being edited
  const [editingConversation, setEditingConversation] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  // State for new conversation dialog
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [newConversationTitle, setNewConversationTitle] = useState('');
  
  // State for conversation settings dialog
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [currentSettings, setCurrentSettings] = useState(DEFAULT_SETTINGS);
  
  // Get models from local storage
  const [models] = useLocalStorage<any[]>('multi-model-chat-models', []);
  
  // Update current settings when selected conversation changes
  useEffect(() => {
    if (selectedConversation) {
      const settings = conversationSettings[selectedConversation.id] || DEFAULT_SETTINGS;
      setCurrentSettings(settings);
    }
  }, [selectedConversation, conversationSettings]);
  
  // Create a new conversation
  const handleCreateConversation = async () => {
    try {
      const title = newConversationTitle.trim() || 'New Multi-Model Chat';
      const conversation = await createConversation(title);
      
      // Save multi-model settings for this conversation
      setConversationSettings(prev => ({
        ...prev,
        [conversation.id]: DEFAULT_SETTINGS
      }));
      
      setIsCreatingConversation(false);
      setNewConversationTitle('');
      
      // Select the new conversation
      selectConversation(conversation.id);
      
      toast({
        title: 'Conversation Created',
        description: `Created new conversation: ${title}`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create conversation',
        variant: 'destructive'
      });
    }
  };
  
  // Update conversation title
  const handleUpdateTitle = async () => {
    if (!editingConversation) return;
    
    try {
      await updateConversationTitle(editingConversation, editTitle);
      setEditingConversation(null);
      setEditTitle('');
      
      toast({
        title: 'Title Updated',
        description: 'Conversation title has been updated',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error updating conversation title:', error);
      toast({
        title: 'Error',
        description: 'Failed to update conversation title',
        variant: 'destructive'
      });
    }
  };
  
  // Delete a conversation
  const handleDeleteConversation = async (id: number) => {
    try {
      await deleteConversation(id);
      
      // Remove settings for this conversation
      setConversationSettings(prev => {
        const newSettings = { ...prev };
        delete newSettings[id];
        return newSettings;
      });
      
      toast({
        title: 'Conversation Deleted',
        description: 'The conversation has been deleted',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete conversation',
        variant: 'destructive'
      });
    }
  };
  
  // Save conversation settings
  const saveConversationSettings = () => {
    if (!selectedConversation) return;
    
    setConversationSettings(prev => ({
      ...prev,
      [selectedConversation.id]: currentSettings
    }));
    
    setIsEditingSettings(false);
    
    toast({
      title: 'Settings Saved',
      description: 'Conversation settings have been updated',
      variant: 'default'
    });
  };
  
  // Toggle a setting
  const toggleSetting = (setting: 'isMultiModel' | 'turnTaking' | 'threadView') => {
    setCurrentSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };
  
  // Toggle a model in active models
  const toggleActiveModel = (modelId: string) => {
    setCurrentSettings(prev => {
      const activeModels = [...prev.activeModels];
      
      if (activeModels.includes(modelId)) {
        // Remove model if it's already active
        return {
          ...prev,
          activeModels: activeModels.filter(id => id !== modelId)
        };
      } else {
        // Add model if it's not active
        return {
          ...prev,
          activeModels: [...activeModels, modelId]
        };
      }
    });
  };
  
  // Get model name by ID
  const getModelName = (modelId: string): string => {
    const model = models.find(m => m.id === modelId);
    return model ? model.name : modelId;
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
  
  // Check if a conversation is a multi-model conversation
  const isMultiModelConversation = (id: number): boolean => {
    return !!conversationSettings[id]?.isMultiModel;
  };
  
  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Conversations</h2>
        <Dialog open={isCreatingConversation} onOpenChange={setIsCreatingConversation}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center">
              <span className="material-icons text-sm mr-1">add</span>
              New Chat
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Multi-Model Chat</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="conversation-title">Conversation Title</Label>
                <Input
                  id="conversation-title"
                  value={newConversationTitle}
                  onChange={(e) => setNewConversationTitle(e.target.value)}
                  placeholder="Enter a title for your conversation"
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" onClick={() => setIsCreatingConversation(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateConversation}>
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Conversation Settings Dialog */}
      {selectedConversation && (
        <Dialog open={isEditingSettings} onOpenChange={setIsEditingSettings}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Conversation Settings</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              {/* Multi-model toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="multi-model-toggle" className="text-sm">
                  Multi-Model Chat
                </Label>
                <Switch
                  id="multi-model-toggle"
                  checked={currentSettings.isMultiModel}
                  onCheckedChange={() => toggleSetting('isMultiModel')}
                />
              </div>
              
              {/* Turn-taking toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="turn-taking-toggle" className="text-sm">
                  Turn-Taking Mode
                </Label>
                <Switch
                  id="turn-taking-toggle"
                  checked={currentSettings.turnTaking}
                  onCheckedChange={() => toggleSetting('turnTaking')}
                  disabled={!currentSettings.isMultiModel}
                />
              </div>
              
              {/* Thread view toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="thread-view-toggle" className="text-sm">
                  Thread View
                </Label>
                <Switch
                  id="thread-view-toggle"
                  checked={currentSettings.threadView}
                  onCheckedChange={() => toggleSetting('threadView')}
                  disabled={!currentSettings.isMultiModel}
                />
              </div>
              
              <Separator />
              
              {/* Active models selection */}
              <div className="space-y-2">
                <Label className="text-sm">Active Models</Label>
                <div className="space-y-2 mt-2">
                  {models.map(model => (
                    <div key={model.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${getModelColor(model.id)}`}>
                          <span className="material-icons text-xs text-white">
                            {getModelIcon(model.id)}
                          </span>
                        </div>
                        <span>{model.name}</span>
                      </div>
                      <Switch
                        checked={currentSettings.activeModels.includes(model.id)}
                        onCheckedChange={() => toggleActiveModel(model.id)}
                        disabled={!currentSettings.isMultiModel}
                      />
                    </div>
                  ))}
                  
                  {models.length === 0 && (
                    <div className="text-center py-2 text-neutral-500">
                      No models configured. Add models in the Model Selection panel.
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" onClick={() => setIsEditingSettings(false)}>
                  Cancel
                </Button>
                <Button onClick={saveConversationSettings}>
                  Save Settings
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Conversation List */}
      <div className="space-y-2">
        {conversations.map(conversation => (
          <div 
            key={conversation.id} 
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              selectedConversation?.id === conversation.id
                ? 'bg-primary/10 border border-primary/30'
                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-transparent'
            }`}
            onClick={() => selectConversation(conversation.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="material-icons text-neutral-500 mr-2">
                  {isMultiModelConversation(conversation.id) ? 'forum' : 'chat'}
                </span>
                
                {editingConversation === conversation.id ? (
                  <div className="flex items-center">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-7 py-1 mr-2"
                      autoFocus
                    />
                    <Button size="sm" variant="ghost" onClick={handleUpdateTitle}>
                      <span className="material-icons text-sm">check</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => {
                        setEditingConversation(null);
                        setEditTitle('');
                      }}
                    >
                      <span className="material-icons text-sm">close</span>
                    </Button>
                  </div>
                ) : (
                  <div className="flex-grow truncate">{conversation.title}</div>
                )}
              </div>
              
              {selectedConversation?.id === conversation.id && (
                <div className="flex items-center space-x-1">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 w-7 p-0" 
                    onClick={() => {
                      setEditingConversation(conversation.id);
                      setEditTitle(conversation.title);
                    }}
                  >
                    <span className="material-icons text-sm">edit</span>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 w-7 p-0" 
                    onClick={() => setIsEditingSettings(true)}
                  >
                    <span className="material-icons text-sm">settings</span>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-600" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conversation.id);
                    }}
                  >
                    <span className="material-icons text-sm">delete</span>
                  </Button>
                </div>
              )}
            </div>
            
            {/* Show active models for multi-model conversations */}
            {isMultiModelConversation(conversation.id) && conversationSettings[conversation.id]?.activeModels.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {conversationSettings[conversation.id].activeModels.map(modelId => (
                  <div 
                    key={modelId} 
                    className={`text-xs px-1.5 py-0.5 rounded-full flex items-center ${getModelColor(modelId)} text-white`}
                  >
                    <span className="material-icons text-xs mr-0.5">{getModelIcon(modelId)}</span>
                    {getModelName(modelId)}
                  </div>
                ))}
              </div>
            )}
            
            {/* Show conversation settings indicators */}
            {isMultiModelConversation(conversation.id) && (
              <div className="flex items-center mt-1 text-xs text-neutral-500">
                {conversationSettings[conversation.id]?.turnTaking && (
                  <div className="flex items-center mr-2">
                    <span className="material-icons text-xs mr-0.5">swap_horiz</span>
                    Turn-taking
                  </div>
                )}
                {conversationSettings[conversation.id]?.threadView && (
                  <div className="flex items-center">
                    <span className="material-icons text-xs mr-0.5">account_tree</span>
                    Threaded
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        
        {conversations.length === 0 && (
          <div className="text-center py-8 text-neutral-500">
            <div className="material-icons text-4xl mb-2">chat</div>
            <p>No conversations yet. Start a new chat to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
