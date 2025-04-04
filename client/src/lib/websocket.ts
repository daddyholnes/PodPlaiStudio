import { useState, useEffect, useRef } from 'react';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    
    // Connection opened
    socket.addEventListener('open', () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
      setError(null);
    });
    
    // Connection error
    socket.addEventListener('error', (event) => {
      console.error('WebSocket error:', event);
      setError('WebSocket connection error');
    });
    
    // Connection closed
    socket.addEventListener('close', (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      setIsConnected(false);
      
      // Attempt to reconnect after a delay, unless explicitly closed
      if (event.code !== 1000) {
        setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          // The next render cycle will attempt to reconnect
          setError('Connection closed. Reconnecting...');
        }, 3000);
      }
    });
    
    // Clean up on unmount
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close(1000, 'Component unmounted');
      }
    };
  }, [error]); // Reconnect when there's an error

  return {
    socket: socketRef.current,
    isConnected,
    error
  };
}
