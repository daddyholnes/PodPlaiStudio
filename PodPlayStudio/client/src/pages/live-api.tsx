import { useState } from 'react';

export default function LiveApiPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [log, setLog] = useState('Ready to start Live API session...');
  
  // Media settings
  const [useCamera, setUseCamera] = useState(true);
  const [useScreen, setUseScreen] = useState(false);
  const [useMicrophone, setUseMicrophone] = useState(true);
  const [responseFormat, setResponseFormat] = useState<'text' | 'audio'>('text');
  
  const handleStartStop = async () => {
    if (isRunning) {
      // Stop the session
      setLog(prev => prev + '\nStopping Live API session...');
      setIsRunning(false);
      setIsConnected(false);
      setLog(prev => prev + '\nLive API session stopped.');
    } else {
      // Start the session
      setLog('Starting Live API session...');
      setIsRunning(true);
      
      try {
        // Request media permissions
        if (useCamera || useMicrophone) {
          setLog(prev => prev + '\nRequesting media permissions...');
          
          // In the real implementation, we would request the actual permissions
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          setLog(prev => prev + '\nMedia permissions granted.');
        }
        
        // Connect to API
        setLog(prev => prev + '\nConnecting to Gemini API...');
        
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setIsConnected(true);
        setLog(prev => prev + '\nConnected to Gemini API. Ready for live interaction!');
        
        // Simulate a response after a moment
        setTimeout(() => {
          if (isRunning) {
            setLog(prev => prev + '\n\nGemini: Hello! I can see and hear you. How can I help you today?');
          }
        }, 2000);
      } catch (error) {
        console.error('Error starting Live API:', error);
        setLog(prev => prev + '\nError: Failed to start Live API session. Please try again.');
        setIsRunning(false);
      }
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto py-4">
      <h1 className="text-2xl font-bold mb-6">Live API</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="relative bg-black rounded-lg aspect-video overflow-hidden flex items-center justify-center">
            {isRunning && useCamera ? (
              <div className="text-white text-center p-4">
                <p className="mb-2">Camera Feed</p>
                <p className="text-xs opacity-50">(Placeholder - actual camera feed would appear here)</p>
              </div>
            ) : (
              <div className="text-white text-center p-4">
                <p>Camera Off</p>
              </div>
            )}
            
            {isConnected && (
              <div className="absolute top-2 right-2 flex items-center">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                <span className="text-white text-xs">Connected</span>
              </div>
            )}
          </div>
          
          <div className="mt-4 border rounded-md p-3 bg-card h-40 overflow-auto font-mono text-sm whitespace-pre-wrap">
            {log}
          </div>
        </div>
        
        <div>
          <div className="border rounded-md p-4 bg-card">
            <h2 className="font-semibold mb-4">Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Media Sources
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={useCamera}
                      onChange={(e) => setUseCamera(e.target.checked)}
                      disabled={isRunning}
                      className="accent-primary"
                    />
                    Camera
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={useMicrophone}
                      onChange={(e) => setUseMicrophone(e.target.checked)}
                      disabled={isRunning}
                      className="accent-primary"
                    />
                    Microphone
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={useScreen}
                      onChange={(e) => setUseScreen(e.target.checked)}
                      disabled={isRunning}
                      className="accent-primary"
                    />
                    Screen Sharing
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Response Format
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="responseFormat"
                      value="text"
                      checked={responseFormat === 'text'}
                      onChange={() => setResponseFormat('text')}
                      disabled={isRunning}
                      className="accent-primary"
                    />
                    Text
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="responseFormat"
                      value="audio"
                      checked={responseFormat === 'audio'}
                      onChange={() => setResponseFormat('audio')}
                      disabled={isRunning}
                      className="accent-primary"
                    />
                    Audio
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Model
                </label>
                <select 
                  className="w-full p-2 border rounded-md bg-background"
                  disabled={isRunning}
                >
                  <option value="gemini-pro-vision">Gemini Pro Vision</option>
                </select>
              </div>
              
              <button
                onClick={handleStartStop}
                className={`w-full px-4 py-2 rounded-md transition-colors ${
                  isRunning 
                    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {isRunning ? 'Stop Session' : 'Start Session'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}