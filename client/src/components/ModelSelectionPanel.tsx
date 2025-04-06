import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/use-local-storage';
import { ModelParameters } from '@shared/schema';
import { toast } from '../hooks/use-toast';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Separator } from './ui/separator';

// Define model types
interface Model {
  id: string;
  name: string;
  provider: 'gemini' | 'claude' | 'custom';
  avatar?: string;
  enabled: boolean;
  autoRespond: boolean;
  parameters: ModelParameters;
}

// Default models configuration
const DEFAULT_MODELS: Model[] = [
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'gemini',
    enabled: true,
    autoRespond: true,
    parameters: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      topP: 0.95,
      topK: 40,
      stream: true
    }
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'claude',
    enabled: false,
    autoRespond: false,
    parameters: {
      temperature: 0.5,
      maxOutputTokens: 4096,
      topP: 0.9,
      topK: 40,
      stream: true
    }
  }
];

// Available model options for adding new models
const AVAILABLE_MODELS = [
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'gemini' },
  { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', provider: 'gemini' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'claude' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'claude' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'claude' },
  { id: 'custom', name: 'Custom Model', provider: 'custom' }
];

export default function ModelSelectionPanel() {
  // Get models from local storage or use defaults
  const [models, setModels] = useLocalStorage<Model[]>('multi-model-chat-models', DEFAULT_MODELS);
  
  // State for model being edited
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  
  // State for new model dialog
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [newModelType, setNewModelType] = useState(AVAILABLE_MODELS[0].id);
  
  // Toggle model enabled state
  const toggleModelEnabled = (modelId: string) => {
    setModels(prevModels => 
      prevModels.map(model => 
        model.id === modelId 
          ? { ...model, enabled: !model.enabled } 
          : model
      )
    );
  };
  
  // Toggle model auto-respond state
  const toggleModelAutoRespond = (modelId: string) => {
    setModels(prevModels => 
      prevModels.map(model => 
        model.id === modelId 
          ? { ...model, autoRespond: !model.autoRespond } 
          : model
      )
    );
  };
  
  // Update model name
  const updateModelName = (modelId: string, name: string) => {
    setModels(prevModels => 
      prevModels.map(model => 
        model.id === modelId 
          ? { ...model, name } 
          : model
      )
    );
  };
  
  // Update model avatar
  const updateModelAvatar = (modelId: string, avatar: string) => {
    setModels(prevModels => 
      prevModels.map(model => 
        model.id === modelId 
          ? { ...model, avatar } 
          : model
      )
    );
  };
  
  // Update model parameter
  const updateModelParameter = (modelId: string, parameter: keyof ModelParameters, value: any) => {
    setModels(prevModels => 
      prevModels.map(model => 
        model.id === modelId 
          ? { 
              ...model, 
              parameters: { 
                ...model.parameters, 
                [parameter]: value 
              } 
            } 
          : model
      )
    );
  };
  
  // Delete model
  const deleteModel = (modelId: string) => {
    setModels(prevModels => prevModels.filter(model => model.id !== modelId));
    toast({
      title: 'Model Removed',
      description: 'The model has been removed from your chat.',
      variant: 'default'
    });
  };
  
  // Add new model
  const addNewModel = () => {
    const modelTemplate = AVAILABLE_MODELS.find(m => m.id === newModelType);
    if (!modelTemplate) return;
    
    // Check if model already exists
    if (models.some(m => m.id === modelTemplate.id && m.provider === modelTemplate.provider)) {
      toast({
        title: 'Model Already Exists',
        description: 'This model is already in your list.',
        variant: 'destructive'
      });
      return;
    }
    
    // Create new model with default parameters
    const newModel: Model = {
      id: modelTemplate.id,
      name: modelTemplate.name,
      provider: modelTemplate.provider as 'gemini' | 'claude' | 'custom',
      enabled: true,
      autoRespond: false,
      parameters: {
        temperature: 0.7,
        maxOutputTokens: modelTemplate.provider === 'claude' ? 4096 : 8192,
        topP: 0.95,
        topK: 40,
        stream: true
      }
    };
    
    setModels(prevModels => [...prevModels, newModel]);
    setIsAddingModel(false);
    
    toast({
      title: 'Model Added',
      description: `${modelTemplate.name} has been added to your chat.`,
      variant: 'default'
    });
  };
  
  // Get model color based on provider
  const getModelColor = (provider: string): string => {
    switch (provider) {
      case 'gemini':
        return 'bg-blue-600';
      case 'claude':
        return 'bg-purple-600';
      case 'custom':
        return 'bg-green-600';
      default:
        return 'bg-neutral-600';
    }
  };
  
  // Get model icon based on provider
  const getModelIcon = (provider: string): string => {
    switch (provider) {
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
  
  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">AI Models</h2>
        <Dialog open={isAddingModel} onOpenChange={setIsAddingModel}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center">
              <span className="material-icons text-sm mr-1">add</span>
              Add Model
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New AI Model</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="model-type">Select Model</Label>
                <select
                  id="model-type"
                  className="w-full p-2 mt-1 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800"
                  value={newModelType}
                  onChange={(e) => setNewModelType(e.target.value)}
                >
                  {AVAILABLE_MODELS.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.provider})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" onClick={() => setIsAddingModel(false)}>
                  Cancel
                </Button>
                <Button onClick={addNewModel}>
                  Add Model
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="space-y-4">
        {models.map(model => (
          <div 
            key={model.id} 
            className="border border-neutral-300 dark:border-neutral-700 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${getModelColor(model.provider)}`}>
                  <span className="material-icons text-sm text-white">
                    {getModelIcon(model.provider)}
                  </span>
                </div>
                <div>
                  <Input
                    className="font-medium border-none p-0 h-auto text-base focus-visible:ring-0"
                    value={model.name}
                    onChange={(e) => updateModelName(model.id, e.target.value)}
                  />
                  <div className="text-xs text-neutral-500">
                    {model.provider.charAt(0).toUpperCase() + model.provider.slice(1)} • {model.id}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={model.enabled}
                  onCheckedChange={() => toggleModelEnabled(model.id)}
                  id={`enable-${model.id}`}
                />
                <Label htmlFor={`enable-${model.id}`} className="text-sm">
                  {model.enabled ? 'Enabled' : 'Disabled'}
                </Label>
              </div>
            </div>
            
            <Separator className="my-3" />
            
            <div className="space-y-4">
              {/* Auto-respond setting */}
              <div className="flex items-center justify-between">
                <Label htmlFor={`auto-respond-${model.id}`} className="text-sm">
                  Auto-respond to other models
                </Label>
                <Switch
                  checked={model.autoRespond}
                  onCheckedChange={() => toggleModelAutoRespond(model.id)}
                  id={`auto-respond-${model.id}`}
                  disabled={!model.enabled}
                />
              </div>
              
              {/* Temperature slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`temperature-${model.id}`} className="text-sm">
                    Temperature
                  </Label>
                  <span className="text-xs text-neutral-500">
                    {model.parameters.temperature.toFixed(1)}
                  </span>
                </div>
                <Slider
                  id={`temperature-${model.id}`}
                  min={0}
                  max={1}
                  step={0.1}
                  value={[model.parameters.temperature]}
                  onValueChange={(value) => updateModelParameter(model.id, 'temperature', value[0])}
                  disabled={!model.enabled}
                />
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>
              
              {/* Max output tokens slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`max-tokens-${model.id}`} className="text-sm">
                    Max Output Length
                  </Label>
                  <span className="text-xs text-neutral-500">
                    {model.parameters.maxOutputTokens} tokens
                  </span>
                </div>
                <Slider
                  id={`max-tokens-${model.id}`}
                  min={1024}
                  max={model.provider === 'claude' ? 4096 : 8192}
                  step={1024}
                  value={[model.parameters.maxOutputTokens]}
                  onValueChange={(value) => updateModelParameter(model.id, 'maxOutputTokens', value[0])}
                  disabled={!model.enabled}
                />
              </div>
              
              {/* Advanced parameters toggle */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <span className="material-icons text-sm mr-1">tune</span>
                    Advanced Parameters
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Advanced Model Parameters</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4 space-y-4">
                    {/* Top P slider */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`top-p-${model.id}`} className="text-sm">
                          Top P
                        </Label>
                        <span className="text-xs text-neutral-500">
                          {model.parameters.topP.toFixed(2)}
                        </span>
                      </div>
                      <Slider
                        id={`top-p-${model.id}`}
                        min={0.1}
                        max={1}
                        step={0.05}
                        value={[model.parameters.topP]}
                        onValueChange={(value) => updateModelParameter(model.id, 'topP', value[0])}
                      />
                      <div className="text-xs text-neutral-500">
                        Controls diversity via nucleus sampling: 0.1 is focused, 1.0 is diverse
                      </div>
                    </div>
                    
                    {/* Top K slider */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`top-k-${model.id}`} className="text-sm">
                          Top K
                        </Label>
                        <span className="text-xs text-neutral-500">
                          {model.parameters.topK}
                        </span>
                      </div>
                      <Slider
                        id={`top-k-${model.id}`}
                        min={1}
                        max={40}
                        step={1}
                        value={[model.parameters.topK]}
                        onValueChange={(value) => updateModelParameter(model.id, 'topK', value[0])}
                      />
                      <div className="text-xs text-neutral-500">
                        Limits token selection to the top K possibilities
                      </div>
                    </div>
                    
                    {/* System instructions */}
                    <div className="space-y-2">
                      <Label htmlFor={`system-instructions-${model.id}`} className="text-sm">
                        System Instructions
                      </Label>
                      <textarea
                        id={`system-instructions-${model.id}`}
                        className="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 min-h-[100px]"
                        value={model.parameters.systemInstructions || ''}
                        onChange={(e) => updateModelParameter(model.id, 'systemInstructions', e.target.value)}
                        placeholder="Enter custom instructions for the model..."
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              {/* Delete model button */}
              <Button 
                variant="destructive" 
                size="sm" 
                className="w-full"
                onClick={() => deleteModel(model.id)}
              >
                <span className="material-icons text-sm mr-1">delete</span>
                Remove Model
              </Button>
            </div>
          </div>
        ))}
        
        {models.length === 0 && (
          <div className="text-center py-8 text-neutral-500">
            <div className="material-icons text-4xl mb-2">smart_toy</div>
            <p>No models configured. Add a model to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
