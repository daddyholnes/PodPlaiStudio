import { useState } from 'react';

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setOutput('');
    
    // TODO: Add actual API call to Gemini
    try {
      // Simulating API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setOutput(
        `This is a placeholder response for: "${prompt}"\n\n` +
        `In the actual implementation, this would be generated content from the Gemini API based on your prompt.`
      );
    } catch (error) {
      console.error('Error generating content:', error);
      setOutput('Error generating content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto py-4">
      <h1 className="text-2xl font-bold mb-6">Generate Content</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium mb-1">
                Prompt
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here..."
                className="w-full p-2 border rounded-md bg-background min-h-[200px]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Model
              </label>
              <select className="w-full p-2 border rounded-md bg-background">
                <option value="gemini-pro">Gemini Pro</option>
                <option value="gemini-pro-vision">Gemini Pro Vision</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="temperature" className="block text-sm font-medium mb-1">
                  Temperature: 0.7
                </label>
                <input
                  id="temperature"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  defaultValue="0.7"
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="maxTokens" className="block text-sm font-medium mb-1">
                  Max Tokens: 1024
                </label>
                <input
                  id="maxTokens"
                  type="range"
                  min="50"
                  max="2048"
                  step="1"
                  defaultValue="1024"
                  className="w-full"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </form>
        </div>
        
        <div>
          <div className="p-4 border rounded-md bg-card min-h-[400px] whitespace-pre-wrap">
            {isGenerating ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-pulse">Generating content...</div>
              </div>
            ) : output ? (
              output
            ) : (
              <div className="text-muted-foreground">
                Generated content will appear here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}