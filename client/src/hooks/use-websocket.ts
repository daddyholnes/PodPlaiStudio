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
  pingInterval?: number;
}

// Create a singleton WebSocket instance that can be shared across the app
let globalSocketRef: WebSocket | null = null;
let globalStatusListeners: Set<(status: WebSocketStatus) => void> = new Set();
let globalMessageListeners: Set<(event: MessageEvent) => void> = new Set();
let reconnectAttempts = 0;
let reconnectTimeout: number | null = null;
let pingIntervalId: number | null = null;
let lastPingTime = 0;
let isConnecting = false;

// Function to update status for all listeners
const updateGlobalStatus = (status: WebSocketStatus) => {
  globalStatusListeners.forEach(listener => listener(status));
};

// Send a ping message to keep connection alive
const sendPing = () => {
  if (!globalSocketRef || globalSocketRef.readyState !== WebSocket.OPEN) return;
  
  try {
    // Send a ping message - the server should respond with a pong
    globalSocketRef.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
    lastPingTime = Date.now();
  } catch (error) {
    console.error('Error sending ping:', error);
  }
};

// Calculate exponential backoff time based on reconnect attempts
const getBackoffTime = (attempt: number, baseInterval: number): number => {
  // Apply exponential backoff with a max of 30 seconds
  return Math.min(baseInterval * Math.pow(1.5, attempt), 30000);
};

// Function to initialize global WebSocket
const initGlobalWebSocket = (
  reconnectInterval = 3000, 
  maxReconnectAttempts = 50,
  pingInterval = 20000
) => {
  // If we're already in the process of connecting, don't start another connection
  if (isConnecting) {
    console.log('Connection already in progress, skipping');
    return;
  }
  
  // If we already have an open connection, don't create a new one
  if (globalSocketRef && globalSocketRef.readyState === WebSocket.OPEN) {
    console.log('WebSocket already connected, not creating a new one');
    return;
  }
  
  // Clean up existing socket if any
  if (globalSocketRef) {
    console.log('Closing existing WebSocket before creating a new one');
    try {
      globalSocketRef.close(1000, "Normal closure");
    } catch (e) {
      console.warn('Error closing socket:', e);
    }
    globalSocketRef = null;
  }
  
  // Clear any existing ping interval
  if (pingIntervalId) {
    window.clearInterval(pingIntervalId);
    pingIntervalId = null;
  }
  
  console.log(`Initializing global WebSocket (attempt ${reconnectAttempts + 1})`);
  isConnecting = true;
  
  try {
    const wsUrl = getWebSocketUrl();
    globalSocketRef = new WebSocket(wsUrl);
    updateGlobalStatus('connecting');
    
    // Set a connection timeout
    const connectionTimeout = window.setTimeout(() => {
      if (globalSocketRef && globalSocketRef.readyState === WebSocket.CONNECTING) {
        console.warn('WebSocket connection timeout, closing and retrying');
        
        try {
          globalSocketRef.close(4000, "Connection timeout");
        } catch (e) {
          console.warn('Error closing socket during timeout:', e);
        }
        
        globalSocketRef = null;
        isConnecting = false;
        
        // Try to reconnect if under max attempts
        if (reconnectAttempts < maxReconnectAttempts) {
          const backoffTime = getBackoffTime(reconnectAttempts, reconnectInterval);
          console.log(`Reconnecting after ${backoffTime}ms (attempt ${reconnectAttempts + 1})`);
          
          if (reconnectTimeout) {
            window.clearTimeout(reconnectTimeout);
          }
          
          reconnectTimeout = window.setTimeout(() => {
            reconnectAttempts++;
            initGlobalWebSocket(reconnectInterval, maxReconnectAttempts, pingInterval);
          }, backoffTime);
        } else {
          console.error(`Max reconnection attempts (${maxReconnectAttempts}) reached`);
        }
      }
    }, 10000); // 10 second connection timeout
    
    // Handle open event
    globalSocketRef.onopen = (event) => {
      console.log('WebSocket connection opened successfully');
      window.clearTimeout(connectionTimeout);
      reconnectAttempts = 0;
      isConnecting = false;
      updateGlobalStatus('open');
      
      // Start ping interval
      if (pingIntervalId) {
        window.clearInterval(pingIntervalId);
      }
      
      pingIntervalId = window.setInterval(() => {
        sendPing();
      }, pingInterval);
      
      // Send initial ping
      sendPing();
    };
    
    // Handle message event
    globalSocketRef.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle pong responses to update the connection status
        if (data.type === 'pong') {
          // Update last received pong time
          lastPingTime = Date.now(); 
          return;
        }
        
        // Pass message to all listeners
        globalMessageListeners.forEach(listener => listener(event));
      } catch (e) {
        // If not JSON, still pass the raw message
        globalMessageListeners.forEach(listener => listener(event));
      }
    };
    
    // Handle close event
    globalSocketRef.onclose = (event) => {
      console.log(`WebSocket connection closed with code ${event.code} and reason: ${event.reason || 'No reason provided'}`);
      window.clearTimeout(connectionTimeout);
      isConnecting = false;
      updateGlobalStatus('closed');
      
      // Clear ping interval
      if (pingIntervalId) {
        window.clearInterval(pingIntervalId);
        pingIntervalId = null;
      }
      
      // Only reconnect for abnormal closures and if under max attempts
      const shouldReconnect = event.code !== 1000 && event.code !== 1001 && reconnectAttempts < maxReconnectAttempts;
      
      if (shouldReconnect) {
        const backoffTime = getBackoffTime(reconnectAttempts, reconnectInterval);
        console.log(`Reconnecting after ${backoffTime}ms (attempt ${reconnectAttempts + 1})`);
        
        if (reconnectTimeout) {
          window.clearTimeout(reconnectTimeout);
        }
        
        reconnectTimeout = window.setTimeout(() => {
          reconnectAttempts++;
          initGlobalWebSocket(reconnectInterval, maxReconnectAttempts, pingInterval);
        }, backoffTime);
      } else if (reconnectAttempts >= maxReconnectAttempts) {
        console.error(`Max reconnection attempts (${maxReconnectAttempts}) reached`);
      }
    };
    
    // Handle error event
    globalSocketRef.onerror = (event) => {
      console.error('WebSocket error occurred');
      updateGlobalStatus('error');
      // We don't close here as the onclose handler will be called after an error
    };
  } catch (error) {
    console.error('Error initializing WebSocket:', error);
    isConnecting = false;
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
    maxReconnectAttempts = 50,
    pingInterval = 20000
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
  
  // Setup a ping monitor effect
  useEffect(() => {
    if (!autoReconnect) return;
    
    const checkConnectionInterval = window.setInterval(() => {
      // If we have a socket and it's been more than 35 seconds since the last ping response
      if (globalSocketRef && 
          globalSocketRef.readyState === WebSocket.OPEN && 
          lastPingTime > 0 && 
          Date.now() - lastPingTime > 35000) {
        console.warn('No ping response for more than 35 seconds, forcing reconnect');
        
        // Force socket closure and reconnect
        try {
          globalSocketRef.close(4000, "Ping timeout");
        } catch (e) {
          console.warn('Error closing socket during ping timeout:', e);
        }
        
        reconnectAttempts = 0;
        initGlobalWebSocket(reconnectInterval, maxReconnectAttempts, pingInterval);
      }
    }, 10000); // Check every 10 seconds
    
    return () => {
      window.clearInterval(checkConnectionInterval);
    };
  }, [autoReconnect, reconnectInterval, maxReconnectAttempts, pingInterval]);
  
  // Reconnect functionality
  const reconnect = useCallback(() => {
    reconnectAttempts = 0;
    initGlobalWebSocket(reconnectInterval, maxReconnectAttempts, pingInterval);
  }, [reconnectInterval, maxReconnectAttempts, pingInterval]);
  
  // Send message via WebSocket
  const sendMessage = useCallback((data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    if (globalSocketRef && globalSocketRef.readyState === WebSocket.OPEN) {
      try {
        globalSocketRef.send(data);
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        
        // If we encounter an error sending, attempt to reconnect
        setTimeout(() => {
          if (globalSocketRef?.readyState !== WebSocket.OPEN) {
            reconnect();
          }
        }, 100);
        
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
    
    if (pingIntervalId) {
      window.clearInterval(pingIntervalId);
      pingIntervalId = null;
    }
    
    if (globalSocketRef) {
      try {
        globalSocketRef.close(1000, "Normal closure");
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