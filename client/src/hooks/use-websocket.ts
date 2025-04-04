import { useEffect, useCallback, useState, useRef } from 'react';
import {
  initWebSocket,
  sendWebSocketMessage,
  addWebSocketMessageHandler,
  removeWebSocketMessageHandler,
  isWebSocketConnected,
  getWebSocket
} from '@/lib/websocket';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(isWebSocketConnected());
  const socketRef = useRef<WebSocket | null>(null);
  
  // Initialize connection
  useEffect(() => {
    const socket = initWebSocket();
    socketRef.current = socket;
    
    const onConnectionChange = () => {
      setIsConnected(isWebSocketConnected());
      // Update the ref if the socket changes
      socketRef.current = getWebSocket();
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
    useMessageHandler,
    socket: socketRef.current
  };
}