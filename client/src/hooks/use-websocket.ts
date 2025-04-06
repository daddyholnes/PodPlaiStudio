import { useState, useEffect, useRef, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  data: any;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

interface WebSocketOptions {
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

export function useWebSocket(url: string, options: WebSocketOptions = {}) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<Error | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const messageListenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const messageQueueRef = useRef<WebSocketMessage[]>([]);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const {
    reconnectAttempts = 10,
    reconnectInterval = 1000,
    onOpen,
    onClose,
    onError,
    onMessage,
  } = options;

  // Calculate exponential backoff delay
  const getBackoffDelay = useCallback((attempt: number) => {
    // Base delay of 1 second with exponential increase
    // Maximum delay capped at 30 seconds
    const maxDelay = 30000;
    const delay = Math.min(
      maxDelay, 
      reconnectInterval * Math.pow(1.5, attempt)
    );
    // Add some randomness to prevent all clients reconnecting at the same time
    return delay + (Math.random() * 1000);
  }, [reconnectInterval]);

  // Connect to WebSocket with error handling
  const connect = useCallback(() => {
    try {
      // If reconnecting, update status
      if (socketRef.current) {
        setStatus('reconnecting');
      } else {
        setStatus('connecting');
      }

      // Create a new WebSocket instance
      const wsUrl = url.startsWith('ws') ? url : `ws://${window.location.host}${url}`;
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = (event) => {
        setStatus('connected');
        setError(null);
        setReconnectCount(0);
        
        // Flush any queued messages
        while (messageQueueRef.current.length > 0) {
          const queuedMessage = messageQueueRef.current.shift();
          if (queuedMessage && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(queuedMessage));
          }
        }
        
        if (onOpen) onOpen(event);
      };
      
      socket.onclose = (event) => {
        setStatus('disconnected');
        
        // Don't attempt to reconnect if closed normally or max attempts reached
        const shouldReconnect = 
          !event.wasClean && 
          reconnectCount < reconnectAttempts;
        
        if (shouldReconnect) {
          const delay = getBackoffDelay(reconnectCount);
          console.log(`WebSocket disconnected. Reconnecting in ${delay}ms...`);
          
          // Schedule reconnect attempt
          reconnectTimerRef.current = setTimeout(() => {
            setReconnectCount(prev => prev + 1);
            connect();
          }, delay);
        } else if (reconnectCount >= reconnectAttempts) {
          setError(new Error(`Failed to connect after ${reconnectAttempts} attempts`));
        }
        
        if (onClose) onClose(event);
      };
      
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          
          // Handle message based on its type
          const listeners = messageListenersRef.current.get(message.type);
          if (listeners) {
            listeners.forEach(callback => callback(message.data));
          }
          
          if (onMessage) onMessage(message);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      socket.onerror = (event) => {
        setError(new Error('WebSocket error'));
        if (onError) onError(event);
      };
      
      socketRef.current = socket;
    } catch (err) {
      setStatus('disconnected');
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [url, onOpen, onClose, onError, onMessage, reconnectCount, reconnectAttempts, getBackoffDelay]);

  // Initialize connection
  useEffect(() => {
    connect();
    
    // Clean up on unmount
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [connect]);

  // Function to send messages with queueing for disconnected state
  const send = useCallback((type: string, data: any = {}) => {
    const message = { type, data };
    
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    } else {
      // Queue the message to be sent when connection is restored
      messageQueueRef.current.push(message);
      return false;
    }
  }, []);

  // Add a message listener for a specific message type
  const addMessageListener = useCallback((type: string, callback: (data: any) => void) => {
    if (!messageListenersRef.current.has(type)) {
      messageListenersRef.current.set(type, new Set());
    }
    
    const listeners = messageListenersRef.current.get(type)!;
    listeners.add(callback);
    
    // Return a function to remove the listener
    return () => {
      listeners.delete(callback);
      if (listeners.size === 0) {
        messageListenersRef.current.delete(type);
      }
    };
  }, []);

  // Close the connection manually
  const close = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    setStatus('disconnected');
  }, []);

  // Force reconnection
  const reconnect = useCallback(() => {
    close();
    setReconnectCount(0);
    connect();
  }, [close, connect]);

  return {
    status,
    error,
    reconnectCount,
    send,
    addMessageListener,
    close,
    reconnect,
    getQueueLength: () => messageQueueRef.current.length,
    clearQueue: () => {
      messageQueueRef.current = [];
    },
  };
}