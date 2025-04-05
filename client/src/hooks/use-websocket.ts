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

// Create a singleton WebSocket instance that can be shared across the app
let globalSocketRef: WebSocket | null = null;
let globalStatusListeners: Set<(status: WebSocketStatus) => void> = new Set();
let globalMessageListeners: Set<(event: MessageEvent) => void> = new Set();
let reconnectAttempts = 0;
let reconnectTimeout: number | null = null;

// Function to update status for all listeners
const updateGlobalStatus = (status: WebSocketStatus) => {
  globalStatusListeners.forEach(listener => listener(status));
};

// Function to initialize global WebSocket
const initGlobalWebSocket = (
  reconnectInterval = 3000, 
  maxReconnectAttempts = 10
) => {
  if (globalSocketRef && globalSocketRef.readyState === WebSocket.OPEN) {
    console.log('WebSocket already connected, not creating a new one');
    return;
  }
  
  // Clean up existing socket if any
  if (globalSocketRef) {
    console.log('Closing existing WebSocket before creating a new one');
    globalSocketRef.close();
  }
  
  console.log(`Initializing global WebSocket (attempt ${reconnectAttempts + 1})`);
  
  try {
    const wsUrl = getWebSocketUrl();
    globalSocketRef = new WebSocket(wsUrl);
    updateGlobalStatus('connecting');
    
    // Handle open event
    globalSocketRef.onopen = (event) => {
      console.log('WebSocket connection opened');
      reconnectAttempts = 0;
      updateGlobalStatus('open');
    };
    
    // Handle message event
    globalSocketRef.onmessage = (event) => {
      globalMessageListeners.forEach(listener => listener(event));
    };
    
    // Handle close event
    globalSocketRef.onclose = (event) => {
      console.log('WebSocket connection closed', event.code, event.reason);
      updateGlobalStatus('closed');
      
      // Handle reconnection
      if (reconnectAttempts < maxReconnectAttempts) {
        if (reconnectTimeout) {
          window.clearTimeout(reconnectTimeout);
        }
        
        reconnectTimeout = window.setTimeout(() => {
          reconnectAttempts++;
          initGlobalWebSocket(reconnectInterval, maxReconnectAttempts);
        }, reconnectInterval);
      } else {
        console.error(`Max reconnection attempts (${maxReconnectAttempts}) reached`);
      }
    };
    
    // Handle error event
    globalSocketRef.onerror = (event) => {
      console.error('WebSocket error:', event);
      updateGlobalStatus('error');
    };
  } catch (error) {
    console.error('Error initializing WebSocket:', error);
    updateGlobalStatus('error');
  }
};

// Initialize the global WebSocket
initGlobalWebSocket();

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10
  } = options;

  const [status, setStatus] = useState<WebSocketStatus>(
    globalSocketRef?.readyState === WebSocket.OPEN ? 'open' : 'connecting'
  );
  
  const statusCallbackRef = useRef(setStatus);
  const messageCallbackRef = useRef(onMessage);
  
  // Update the refs when callbacks change
  useEffect(() => {
    messageCallbackRef.current = onMessage;
  }, [onMessage]);
  
  useEffect(() => {
    statusCallbackRef.current = setStatus;
  }, [setStatus]);
  
  // Register status listener
  useEffect(() => {
    const statusListener = (newStatus: WebSocketStatus) => {
      if (statusCallbackRef.current) {
        statusCallbackRef.current(newStatus);
      }
      
      // Call the appropriate event handler
      if (newStatus === 'open' && onOpen) {
        onOpen(new Event('open'));
      } else if (newStatus === 'closed' && onClose) {
        onClose(new CloseEvent('close'));
      } else if (newStatus === 'error' && onError) {
        onError(new Event('error'));
      }
    };
    
    globalStatusListeners.add(statusListener);
    
    // Set initial status
    if (globalSocketRef) {
      if (globalSocketRef.readyState === WebSocket.OPEN) {
        statusListener('open');
      } else if (globalSocketRef.readyState === WebSocket.CONNECTING) {
        statusListener('connecting');
      } else {
        statusListener('closed');
      }
    }
    
    return () => {
      globalStatusListeners.delete(statusListener);
    };
  }, [onOpen, onClose, onError]);
  
  // Register message listener
  useEffect(() => {
    if (!onMessage) return;
    
    const messageListener = (event: MessageEvent) => {
      if (messageCallbackRef.current) {
        messageCallbackRef.current(event);
      }
    };
    
    globalMessageListeners.add(messageListener);
    
    return () => {
      globalMessageListeners.delete(messageListener);
    };
  }, [onMessage]);
  
  // Reconnect functionality
  const reconnect = useCallback(() => {
    reconnectAttempts = 0;
    initGlobalWebSocket(reconnectInterval, maxReconnectAttempts);
  }, [reconnectInterval, maxReconnectAttempts]);
  
  // Send message via WebSocket
  const sendMessage = useCallback((data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    if (globalSocketRef && globalSocketRef.readyState === WebSocket.OPEN) {
      try {
        globalSocketRef.send(data);
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        return false;
      }
    } else {
      console.warn('WebSocket not ready, current state:', globalSocketRef?.readyState);
      
      // If socket isn't connected, try to reconnect
      if (!globalSocketRef || globalSocketRef.readyState >= WebSocket.CLOSING) {
        reconnect();
      }
      return false;
    }
  }, [reconnect]);
  
  // Close connection and prevent auto-reconnect
  const closeConnection = useCallback(() => {
    if (reconnectTimeout) {
      window.clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    
    if (globalSocketRef) {
      try {
        globalSocketRef.close();
        globalSocketRef = null;
      } catch (e) {
        console.error('Error closing WebSocket:', e);
      }
    }
  }, []);
  
  return {
    status,
    socket: globalSocketRef,
    isConnected: status === 'open',
    sendMessage,
    closeConnection,
    reconnect,
    reconnectCount: reconnectAttempts
  };
}