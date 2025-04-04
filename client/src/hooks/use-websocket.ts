import { useEffect, useCallback, useState } from 'react';
import {
  initWebSocket,
  sendWebSocketMessage,
  addWebSocketMessageHandler,
  removeWebSocketMessageHandler,
  isWebSocketConnected
} from '@/lib/websocket';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(isWebSocketConnected());
  
  // Initialize connection
  useEffect(() => {
    const socket = initWebSocket();
    
    const onConnectionChange = () => {
      setIsConnected(isWebSocketConnected());
    };
    
    // Check connection status periodically
    const intervalId = setInterval(onConnectionChange, 1000);
    
    // Connect event handlers
    socket.addEventListener('open', onConnectionChange);
    socket.addEventListener('close', onConnectionChange);
    socket.addEventListener('error', onConnectionChange);
    
    return () => {
      clearInterval(intervalId);
      socket.removeEventListener('open', onConnectionChange);
      socket.removeEventListener('close', onConnectionChange);
      socket.removeEventListener('error', onConnectionChange);
    };
  }, []);
  
  // Send a message
  const sendMessage = useCallback((message: any) => {
    return sendWebSocketMessage(message);
  }, []);
  
  // Add a message handler that will be removed when the component unmounts
  const useMessageHandler = (callback: (event: MessageEvent) => void) => {
    useEffect(() => {
      addWebSocketMessageHandler(callback);
      return () => {
        removeWebSocketMessageHandler(callback);
      };
    }, [callback]);
  };
  
  return {
    isConnected,
    sendMessage,
    useMessageHandler
  };
}