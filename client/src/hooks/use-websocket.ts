import { useEffect, useRef, useState, useCallback } from 'react';
import { getWebSocketUrl } from '@/lib/websocket';

export type WebSocketStatus = 'connecting' | 'open' | 'closed' | 'error';

interface UseWebSocketOptions {
  onMessage?: (event: MessageEvent) => void;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    autoReconnect = true,
    reconnectInterval = 2000,
    maxReconnectAttempts = 5
  } = options;

  const [status, setStatus] = useState<WebSocketStatus>('connecting');
  const [reconnectCount, setReconnectCount] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Initialize WebSocket connection
  const connect = useCallback(() => {
    try {
      // Close existing connection if any
      if (socketRef.current) {
        socketRef.current.close();
      }

      // Create new WebSocket connection
      const wsUrl = getWebSocketUrl();
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      setStatus('connecting');

      // Setup event handlers
      socket.onopen = (event) => {
        setStatus('open');
        setReconnectCount(0);
        if (onOpen) onOpen(event);
      };

      socket.onmessage = (event) => {
        if (onMessage) onMessage(event);
      };

      socket.onclose = (event) => {
        setStatus('closed');
        if (onClose) onClose(event);

        // Handle reconnection
        if (autoReconnect && reconnectCount < maxReconnectAttempts) {
          if (reconnectTimeoutRef.current) {
            window.clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = window.setTimeout(() => {
            setReconnectCount(prev => prev + 1);
            connect();
          }, reconnectInterval);
        }
      };

      socket.onerror = (event) => {
        setStatus('error');
        if (onError) onError(event);
        
        // Auto close on error to trigger reconnect
        socket.close();
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setStatus('error');
    }
  }, [
    onMessage, 
    onOpen, 
    onClose, 
    onError, 
    autoReconnect, 
    reconnectInterval, 
    maxReconnectAttempts, 
    reconnectCount
  ]);

  // Send message via WebSocket
  const sendMessage = useCallback((data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(data);
      return true;
    }
    return false;
  }, []);

  // Close WebSocket connection
  const closeConnection = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    setStatus('closed');
  }, []);

  // Initialize WebSocket on component mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      closeConnection();
    };
  }, [connect, closeConnection]);

  return {
    status,
    socket: socketRef.current,
    isConnected: status === 'open',
    sendMessage,
    closeConnection,
    reconnect: connect,
    reconnectCount
  };
}