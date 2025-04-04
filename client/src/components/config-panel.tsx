import { useState } from 'react';
import { useGemini } from '@/hooks/use-gemini';
import { useQuery } from '@tanstack/react-query';

export default function ConfigPanel() {
  const { 
    parameters, 
    updateParameters,
    streamResponse
  } = useGemini();
  
  // Query API status
  const { data: apiStatus } = useQuery({
    queryKey: ['/api/status'],
  });
  
  const [showApiKey, setShowApiKey] = useState(false);
  
  return (
    <div className="w-72 border-l border-neutral-300 dark:border-neutral-700 flex flex-col bg-neutral-100 dark:bg-neutral-800 overflow-y-auto">
      <div className="p-4 border-b border-neutral-300 dark:border-neutral-700">
        <h2 className="font-google-sans font-medium">Configuration</h2>
      </div>
      
      <div className="flex-grow overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Temperature */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Temperature</label>
              <span className="text-sm">{parameters.temperature.toFixed(1)}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              value={parameters.temperature}
              onChange={(e) => updateParameters({ temperature: parseFloat(e.target.value) })}
              className="w-full h-2 bg-neutral-300 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              <span>Precise</span>
              <span>Balanced</span>
              <span>Creative</span>
            </div>
          </div>
          
          {/* Max Output Tokens */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Max Output Tokens</label>
              <span className="text-sm">{parameters.maxOutputTokens}</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="8192" 
              step="1" 
              value={parameters.maxOutputTokens}
              onChange={(e) => updateParameters({ maxOutputTokens: parseInt(e.target.value) })}
              className="w-full h-2 bg-neutral-300 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          {/* Top K */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Top K</label>
              <span className="text-sm">{parameters.topK}</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="40" 
              step="1" 
              value={parameters.topK}
              onChange={(e) => updateParameters({ topK: parseInt(e.target.value) })}
              className="w-full h-2 bg-neutral-300 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          {/* Top P */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Top P</label>
              <span className="text-sm">{parameters.topP.toFixed(2)}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={parameters.topP}
              onChange={(e) => updateParameters({ topP: parseFloat(e.target.value) })}
              className="w-full h-2 bg-neutral-300 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          {/* Other Options */}
          <div className="pt-2 border-t border-neutral-300 dark:border-neutral-700">
            <h3 className="text-sm font-medium mb-3">Advanced Options</h3>
            
            <div className="space-y-3">
              {/* Stream Response */}
              <div className="flex justify-between items-center">
                <label className="text-sm">Stream Response</label>
                <button 
                  className={`w-9 h-5 relative rounded-full ${parameters.stream ? 'bg-primary' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                  onClick={() => updateParameters({ stream: !parameters.stream })}
                >
                  <span 
                    className={`absolute h-4 w-4 ${
                      parameters.stream ? 'left-4' : 'left-0.5'
                    } top-0.5 rounded-full bg-white transition-all duration-200`}
                  ></span>
                </button>
              </div>
              
              {/* System Instructions */}
              <div>
                <label className="text-sm block mb-2">System Instructions</label>
                <textarea 
                  className="w-full border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 bg-white dark:bg-neutral-900 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary focus:border-transparent"
                  rows={3}
                  placeholder="Define how the assistant behaves..."
                  value={parameters.systemInstructions || ''}
                  onChange={(e) => updateParameters({ systemInstructions: e.target.value })}
                />
              </div>
              
              {/* Safety Settings */}
              <div>
                <label className="text-sm block mb-2">Safety Settings</label>
                <button className="w-full text-left border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 bg-white dark:bg-neutral-900 text-xs flex justify-between items-center">
                  <span>Manage safety settings</span>
                  <span className="material-icons text-xs">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* API Key Display */}
      <div className="p-4 border-t border-neutral-300 dark:border-neutral-700 mt-auto">
        <div className="text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium">API Key:</span>
            {apiStatus?.apiKeyConfigured ? (
              <span className="text-green-500 flex items-center">
                <span className="material-icons text-xs mr-1">check_circle</span>
                Configured
              </span>
            ) : (
              <span className="text-error flex items-center">
                <span className="material-icons text-xs mr-1">error</span>
                Missing
              </span>
            )}
          </div>
          <div className="font-mono bg-white dark:bg-neutral-900 p-2 rounded text-xs border border-neutral-300 dark:border-neutral-700 flex justify-between items-center">
            <span>{apiStatus?.apiKeyMasked || 'GEMINI_API_KEY not set'}</span>
            <button 
              className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              <span className="material-icons text-xs">{showApiKey ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
