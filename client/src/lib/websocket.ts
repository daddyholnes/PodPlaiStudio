// Define the connection protocol based on the current environment
const getWebSocketUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
};

// WebSocket connection instance
let socket: WebSocket | null = null;

// Connection status
let isConnected = false;

// Queue of message callbacks
type MessageCallback = (event: MessageEvent) => void;
const messageCallbacks: MessageCallback[] = [];

// Initialize the WebSocket connection
export const initWebSocket = (): WebSocket => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    socket = new WebSocket(getWebSocketUrl());
    
    socket.onopen = () => {
      console.log('WebSocket connection established');
      isConnected = true;
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
      isConnected = false;
      
      // Reconnect after 2 seconds
      setTimeout(() => {
        console.log('Attempting to reconnect WebSocket...');
        initWebSocket();
      }, 2000);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onmessage = (event) => {
      // Call all registered message handlers
      messageCallbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in message callback:', error);
        }
      });
    };
  }
  
  return socket;
};

// Send a message through the WebSocket
export const sendWebSocketMessage = (message: any): boolean => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error('WebSocket is not connected');
    // Try to reconnect
    socket = initWebSocket();
    return false;
  }
  
  try {
    socket.send(JSON.stringify(message));
    return true;
  } catch (error) {
    console.error('Error sending WebSocket message:', error);
    return false;
  }
};

// Add a message handler
export const addWebSocketMessageHandler = (callback: MessageCallback): void => {
  messageCallbacks.push(callback);
};

// Remove a message handler
export const removeWebSocketMessageHandler = (callback: MessageCallback): void => {
  const index = messageCallbacks.indexOf(callback);
  if (index !== -1) {
    messageCallbacks.splice(index, 1);
  }
};

// Check if WebSocket is connected
export const isWebSocketConnected = (): boolean => {
  return isConnected && socket !== null && socket.readyState === WebSocket.OPEN;
};

// Initialize the WebSocket connection when this module is imported
initWebSocket();