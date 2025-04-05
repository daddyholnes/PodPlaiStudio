import { useState, useEffect } from 'react';
import { useToast } from '../hooks/use-toast';
import { useApiStatus } from '../hooks/use-api-status';

export default function SettingsPage() {
  const { toast } = useToast();
  const { status } = useApiStatus();
  const [apiKey, setApiKey] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    // Load current settings
    if (status) {
      setApiKey(status.apiKey || '');
    }
    
    // Get theme from localStorage
    const savedTheme = localStorage.getItem('vite-ui-theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, [status]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          theme,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      // Save theme to localStorage as well
      localStorage.setItem('vite-ui-theme', theme);
      
      toast({
        title: 'Settings saved',
        description: 'Your settings have been updated successfully.',
      });
      
      // Reload to apply theme and API key changes
      window.location.reload();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
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
              autoComplete="off"
            />
            <p className="text-xs mt-1 text-muted-foreground">
              Get your API key from <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Theme
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={theme === 'light'}
                  onChange={() => setTheme('light')}
                  className="accent-primary"
                />
                Light
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={theme === 'dark'}
                  onChange={() => setTheme('dark')}
                  className="accent-primary"
                />
                Dark
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="theme"
                  value="system"
                  checked={theme === 'system'}
                  onChange={() => setTheme('system')}
                  className="accent-primary"
                />
                System
              </label>
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
      
      <div className="mt-12 space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">About</h2>
          <div className="p-4 bg-card rounded-lg">
            <p>
              PodPlay API Studio is an interface for interacting with Gemini AI models.
              Built with modern web technologies, it provides a comprehensive toolset
              for AI-powered text generation, chat, code execution, and more.
            </p>
          </div>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">Resources</h2>
          <ul className="space-y-2">
            <li>
              <a 
                href="https://ai.google.dev/docs/gemini_api" 
                target="_blank" 
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                Gemini API Documentation
              </a>
            </li>
            <li>
              <a 
                href="https://aistudio.google.com/" 
                target="_blank" 
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                Google AI Studio
              </a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}