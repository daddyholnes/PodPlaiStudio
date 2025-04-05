import { useState, useEffect } from 'react';
import { useTheme } from '@/components/theme-provider';
import { useApiStatus } from '@/hooks/use-api-status';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Sun, Moon, Monitor, Info, Check, X } from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { status, isLoading } = useApiStatus();
  const { success, error } = useToast();
  
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    // If the API key is already configured, set a placeholder
    if (!isLoading && status?.apiKeyConfigured) {
      setApiKey('••••••••••••••••••••••••');
    }
  }, [isLoading, status]);
  
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      
      // If API key hasn't been modified, don't send it
      const dataToSend = {
        apiKey: apiKey.includes('•') ? undefined : apiKey,
        theme
      };
      
      await apiRequest('/api/settings', 'POST', dataToSend);
      
      success('Settings saved successfully');
    } catch (err) {
      console.error('Error saving settings:', err);
      error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">API Configuration</h2>
        
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium">API Status</h3>
            {status?.apiKeyConfigured ? (
              <span className="inline-flex items-center bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded-full">
                <Check className="h-3 w-3 mr-1" />
                Configured
              </span>
            ) : (
              <span className="inline-flex items-center bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs px-2 py-1 rounded-full">
                <X className="h-3 w-3 mr-1" />
                Not Configured
              </span>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            {status?.apiKeyConfigured 
              ? 'Your Gemini API key is configured. You can update it if needed.' 
              : 'To use PodPlay API Studio, you need to configure your Gemini API key. You can get it from Google AI Studio.'}
          </p>
          
          <div className="flex items-center gap-2 mb-2">
            <Info size={16} className="text-blue-500" />
            <span className="text-sm text-blue-500">
              {status?.apiKeyConfigured && status?.apiKey === null ? 
                'API key is set through environment variables. Changes here will override it.' : 
                'You can also set the GEMINI_API_KEY environment variable in your Replit Secrets.'}
            </span>
          </div>
        </div>
        
        <form onSubmit={handleSaveSettings}>
          <div className="mb-4">
            <label htmlFor="apiKey" className="block text-sm font-medium mb-1">
              Gemini API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
              className="w-full p-2 border rounded-md bg-background"
            />
          </div>
          
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save API Key'}
          </button>
        </form>
      </div>
      
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Theme Settings</h2>
        
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setTheme("light")}
            className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
              theme === "light" ? "border-primary bg-primary/5" : "border-muted"
            }`}
          >
            <Sun size={24} className="mb-2" />
            <span>Light</span>
          </button>
          
          <button
            onClick={() => setTheme("dark")}
            className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
              theme === "dark" ? "border-primary bg-primary/5" : "border-muted"
            }`}
          >
            <Moon size={24} className="mb-2" />
            <span>Dark</span>
          </button>
          
          <button
            onClick={() => setTheme("system")}
            className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
              theme === "system" ? "border-primary bg-primary/5" : "border-muted"
            }`}
          >
            <Monitor size={24} className="mb-2" />
            <span>System</span>
          </button>
        </div>
      </div>
      
      <div className="border rounded-lg p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">About</h2>
        <p className="text-muted-foreground">
          PodPlay API Studio v1.0.0<br />
          An interface for interacting with Gemini AI models. Built with React, TypeScript, and Express.
        </p>
      </div>
    </div>
  );
}