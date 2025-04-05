import { useState, useEffect, useRef } from 'react';
import { useApiStatus } from '@/hooks/use-api-status';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { Settings, Mic, Camera, Play, Square, Monitor } from 'lucide-react';

interface ModelConfig {
  model: string;
  temperature: number;
  maxOutputTokens?: number;
}

type LiveMode = 'none' | 'camera' | 'screen' | 'audio';

export default function LiveApiPage() {
  const { isApiConfigured, isLoading: isApiStatusLoading } = useApiStatus();
  const { success, error } = useToast();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveMode, setLiveMode] = useState<LiveMode>('none');
  const [showConfig, setShowConfig] = useState(false);
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    model: 'gemini-1.5-pro-latest',
    temperature: 0.2,
    maxOutputTokens: 1024
  });
  
  const [conversation, setConversation] = useState<Array<{
    type: 'user' | 'assistant' | 'system' | 'media';
    content: string;
    timestamp: Date;
  }>>([
    {
      type: 'system',
      content: 'Welcome to Live API mode. Use the controls below to start a live session with the Gemini API.',
      timestamp: new Date()
    }
  ]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Connect to WebSocket for real-time communication
  useEffect(() => {
    if (!isApiConfigured || isApiStatusLoading) return;
    
    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        console.log('Connecting to WebSocket URL:', wsUrl);
        
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        
        ws.onopen = () => {
          setIsConnected(true);
          addSystemMessage('Connected to Gemini Live API');
        };
        
        ws.onclose = () => {
          setIsConnected(false);
          addSystemMessage('Disconnected from Gemini Live API');
          
          // Attempt to reconnect after a delay
          setTimeout(connectWebSocket, 3000);
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          if (data.type === 'response') {
            addAssistantMessage(data.content);
            setIsProcessing(false);
          } else if (data.type === 'error') {
            error(data.message || 'An error occurred');
            addSystemMessage(`Error: ${data.message}`);
            setIsProcessing(false);
          } else if (data.type === 'stream') {
            // Handle streaming responses here if implemented
            addAssistantMessage(data.content);
          }
        };
      } catch (err) {
        console.error('Failed to connect to WebSocket:', err);
        error('Failed to connect to Live API');
        setTimeout(connectWebSocket, 5000);
      }
    };
    
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isApiConfigured, isApiStatusLoading, error]);
  
  // Helper to add system messages to the conversation
  const addSystemMessage = (content: string) => {
    setConversation(prev => [
      ...prev,
      {
        type: 'system',
        content,
        timestamp: new Date()
      }
    ]);
  };
  
  // Helper to add assistant messages to the conversation
  const addAssistantMessage = (content: string) => {
    setConversation(prev => [
      ...prev,
      {
        type: 'assistant',
        content,
        timestamp: new Date()
      }
    ]);
  };
  
  // Helper to add user messages to the conversation
  const addUserMessage = (content: string) => {
    setConversation(prev => [
      ...prev,
      {
        type: 'user',
        content,
        timestamp: new Date()
      }
    ]);
  };
  
  // Helper to add media messages to the conversation
  const addMediaMessage = (content: string) => {
    setConversation(prev => [
      ...prev,
      {
        type: 'media',
        content,
        timestamp: new Date()
      }
    ]);
  };
  
  // Update model configuration
  const updateModelConfig = (key: string, value: any) => {
    setModelConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Start camera capture
  const startCamera = async () => {
    try {
      if (streamRef.current) {
        stopLiveMode();
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setLiveMode('camera');
      setIsLiveActive(true);
      addSystemMessage('Camera started. Click "Start Live Session" to begin processing.');
    } catch (err) {
      console.error('Error accessing camera:', err);
      error('Failed to access camera');
    }
  };
  
  // Start screen capture
  const startScreenCapture = async () => {
    try {
      if (streamRef.current) {
        stopLiveMode();
      }
      
      // @ts-ignore - TypeScript doesn't know about getDisplayMedia yet
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setLiveMode('screen');
      setIsLiveActive(true);
      addSystemMessage('Screen sharing started. Click "Start Live Session" to begin processing.');
    } catch (err) {
      console.error('Error accessing screen:', err);
      error('Failed to access screen');
    }
  };
  
  // Start audio capture
  const startAudio = async () => {
    try {
      if (streamRef.current) {
        stopLiveMode();
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      });
      
      streamRef.current = stream;
      setLiveMode('audio');
      setIsLiveActive(true);
      addSystemMessage('Audio started. Click "Start Live Session" to begin processing.');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      error('Failed to access microphone');
    }
  };
  
  // Stop any active media capture
  const stopLiveMode = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setLiveMode('none');
    setIsLiveActive(false);
    addSystemMessage('Live session stopped');
  };
  
  // Start the live session with Gemini
  const startLiveSession = () => {
    if (!isConnected || !isLiveActive) return;
    
    setIsProcessing(true);
    
    // Start capturing frames or audio and sending to server
    if (liveMode === 'camera' || liveMode === 'screen') {
      startVideoProcessing();
    } else if (liveMode === 'audio') {
      startAudioProcessing();
    }
  };
  
  // Stop the live session
  const stopLiveSession = () => {
    setIsProcessing(false);
    addSystemMessage('Gemini processing stopped');
    
    // Notify server to stop processing
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'command',
        command: 'stop'
      }));
    }
  };
  
  // Process video frames
  const startVideoProcessing = () => {
    if (!canvasRef.current || !videoRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      error('Cannot start video processing');
      setIsProcessing(false);
      return;
    }
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      error('Cannot get canvas context');
      setIsProcessing(false);
      return;
    }
    
    // Set canvas size to match video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Send initial message to server
    wsRef.current.send(JSON.stringify({
      type: 'start',
      mode: liveMode,
      modelConfig
    }));
    
    addUserMessage(`Started ${liveMode} streaming to Gemini...`);
    
    // Function to capture and send frames
    const captureFrame = () => {
      if (!isProcessing || !context || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      
      try {
        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to data URL
        const imageData = canvas.toDataURL('image/jpeg', 0.7);
        
        // Send frame to server
        wsRef.current.send(JSON.stringify({
          type: 'frame',
          data: imageData
        }));
        
        // Schedule next frame capture
        setTimeout(captureFrame, 1000); // Capture every second
      } catch (err) {
        console.error('Error capturing frame:', err);
      }
    };
    
    // Start capturing frames
    captureFrame();
  };
  
  // Process audio
  const startAudioProcessing = () => {
    if (!streamRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      error('Cannot start audio processing');
      setIsProcessing(false);
      return;
    }
    
    // Send initial message to server
    wsRef.current.send(JSON.stringify({
      type: 'start',
      mode: 'audio',
      modelConfig
    }));
    
    addUserMessage('Started audio streaming to Gemini...');
    
    // Set up audio processing
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(streamRef.current);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    
    source.connect(processor);
    processor.connect(audioContext.destination);
    
    processor.onaudioprocess = (e) => {
      if (!isProcessing || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        source.disconnect();
        processor.disconnect();
        return;
      }
      
      try {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Convert audio data to base64
        const dataArray = new Uint8Array(inputData.length * 4);
        const view = new DataView(dataArray.buffer);
        
        for (let i = 0; i < inputData.length; i++) {
          view.setFloat32(i * 4, inputData[i], true);
        }
        
        const base64Data = btoa(String.fromCharCode.apply(null, Array.from(dataArray)));
        
        // Send audio data to server
        wsRef.current.send(JSON.stringify({
          type: 'audio',
          data: base64Data,
          sampleRate: audioContext.sampleRate
        }));
      } catch (err) {
        console.error('Error processing audio:', err);
      }
    };
  };
  
  // Reference to auto-scroll the conversation
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to the bottom of the conversation
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);
  
  // If API is not configured, show a prompt to configure it
  if (!isApiConfigured && !isApiStatusLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-16rem)] text-center px-4">
        <h2 className="text-xl font-semibold mb-4">API Key Required</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          To use the Live API feature, you need to configure your Gemini API key in the settings.
        </p>
        <Link href="/settings">
          <a className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            <Settings size={16} />
            <span>Go to Settings</span>
          </a>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b py-2 px-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Live API</h1>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 rounded-md hover:bg-muted"
            title="Model settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
      
      {/* Model configuration (collapsible) */}
      {showConfig && (
        <div className="p-4 border-b bg-muted/50">
          <h2 className="text-sm font-medium mb-3">Model Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="model" className="block text-sm font-medium mb-1">
                Model
              </label>
              <select
                id="model"
                value={modelConfig.model}
                onChange={(e) => updateModelConfig('model', e.target.value)}
                className="w-full p-2 rounded-md border bg-background"
                disabled={isProcessing}
              >
                <option value="gemini-1.5-pro-latest">Gemini 1.5 Pro</option>
                <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash</option>
                <option value="gemini-1.0-pro">Gemini 1.0 Pro</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="temperature" className="block text-sm font-medium mb-1">
                Temperature: {modelConfig.temperature}
              </label>
              <input
                id="temperature"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={modelConfig.temperature}
                onChange={(e) => updateModelConfig('temperature', parseFloat(e.target.value))}
                className="w-full"
                disabled={isProcessing}
              />
            </div>
            
            <div>
              <label htmlFor="maxTokens" className="block text-sm font-medium mb-1">
                Max Output Tokens
              </label>
              <input
                id="maxTokens"
                type="number"
                value={modelConfig.maxOutputTokens}
                onChange={(e) => updateModelConfig('maxOutputTokens', parseInt(e.target.value) || 1024)}
                className="w-full p-2 rounded-md border bg-background"
                disabled={isProcessing}
              />
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 flex-1">
        {/* Left Column - Video Display */}
        <div className="col-span-2 flex flex-col">
          <div className="rounded-md border bg-muted/40 aspect-video flex items-center justify-center overflow-hidden">
            {liveMode === 'none' ? (
              <div className="text-muted-foreground text-center p-4">
                <p>Select a live mode to begin</p>
                <p className="text-sm mt-2">Camera, Screen, or Audio</p>
              </div>
            ) : (
              liveMode !== 'audio' && (
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  muted
                  playsInline
                />
              )
            )}
            
            {liveMode === 'audio' && (
              <div className="flex flex-col items-center justify-center p-6">
                <Mic size={48} className="text-primary mb-4" />
                <p className="text-muted-foreground">Audio Mode Active</p>
                {isProcessing && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="block w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                    <span className="text-sm">Streaming to Gemini...</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Hidden canvas for processing video frames */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
          
          <div className="flex justify-between mt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={startCamera}
                disabled={isProcessing}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  liveMode === 'camera' ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'
                }`}
              >
                <Camera size={16} />
                <span>Camera</span>
              </button>
              
              <button
                onClick={startScreenCapture}
                disabled={isProcessing}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  liveMode === 'screen' ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'
                }`}
              >
                <Monitor size={16} />
                <span>Screen</span>
              </button>
              
              <button
                onClick={startAudio}
                disabled={isProcessing}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  liveMode === 'audio' ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'
                }`}
              >
                <Mic size={16} />
                <span>Audio</span>
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              {isLiveActive && !isProcessing && (
                <button
                  onClick={startLiveSession}
                  disabled={!isConnected || !isLiveActive || isProcessing}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Play size={16} />
                  <span>Start Live Session</span>
                </button>
              )}
              
              {isProcessing && (
                <button
                  onClick={stopLiveSession}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <Square size={16} />
                  <span>Stop</span>
                </button>
              )}
              
              {isLiveActive && (
                <button
                  onClick={stopLiveMode}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <span>Close</span>
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Column - Conversation */}
        <div className="flex flex-col border rounded-md">
          <div className="p-2 border-b bg-muted/20 text-sm font-medium">
            Live Conversation
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {conversation.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-lg px-3 py-2 ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : message.type === 'assistant'
                      ? 'bg-muted'
                      : message.type === 'system'
                      ? 'bg-blue-100 dark:bg-blue-900 text-sm italic'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{message.content}</div>
                  {message.type !== 'system' && (
                    <div className="text-xs opacity-70 text-right mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-3 border-t">
            <div className="text-center text-sm text-muted-foreground">
              {!isConnected ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="block w-2 h-2 bg-yellow-500 rounded-full"></span>
                  Connecting to Gemini Live API...
                </span>
              ) : isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Processing Live Feed
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span className="block w-2 h-2 bg-green-500 rounded-full"></span>
                  Connected to Gemini Live API
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}