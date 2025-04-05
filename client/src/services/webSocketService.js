/**
 * Configure WebSocket to automatically reconnect when connection is lost
 */
export const configureWebSocketReconnection = () => {
  // Store the original WebSocket constructor
  const OrigWebSocket = window.WebSocket;
  const reconnectInterval = 3000; // Reconnect after 3 seconds
  const maxReconnectAttempts = 5;

  // Replace the WebSocket constructor with our enhanced version
  window.WebSocket = function(url, protocols) {
    // Create a new WebSocket instance
    const ws = new OrigWebSocket(url, protocols);
    
    // Add reconnection functionality
    ws.reconnectAttempts = 0;
    
    const reconnect = () => {
      if (ws.reconnectAttempts >= maxReconnectAttempts) {
        console.error('Maximum reconnection attempts reached. Giving up.');
        return;
      }
      
      ws.reconnectAttempts++;
      console.log(`Attempting to reconnect (${ws.reconnectAttempts}/${maxReconnectAttempts})...`);
      
      // Attempt to create a new WebSocket
      const newWs = new OrigWebSocket(url, protocols);
      
      // Copy event handlers from the old WebSocket
      newWs.onopen = ws.onopen;
      newWs.onclose = ws.onclose;
      newWs.onmessage = ws.onmessage;
      newWs.onerror = ws.onerror;
      
      // If reconnect successful, replace all properties
      newWs.addEventListener('open', () => {
        Object.assign(ws, newWs);
        ws.reconnectAttempts = 0;
        console.log('WebSocket reconnected successfully');
      });
      
      // Set up reconnection for the new WebSocket too
      newWs.addEventListener('close', (event) => {
        if (!event.wasClean) {
          setTimeout(reconnect, reconnectInterval);
        }
      });
    };
    
    // Set up automatic reconnection
    const originalOnClose = ws.onclose;
    ws.addEventListener('close', (event) => {
      if (originalOnClose) {
        originalOnClose.call(ws, event);
      }
      
      if (!event.wasClean) {
        setTimeout(reconnect, reconnectInterval);
      }
    });
    
    return ws;
  };
};

/**
 * Creates a notification for WebSocket connection status
 * @param {string} message - Notification message
 * @param {string} type - Notification type (error, warning, info)
 */
export const createConnectionNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `websocket-notification ${type}`;
  notification.innerHTML = message;
  
  // Add to document
  document.body.appendChild(notification);
  
  // Auto-remove after a delay
  setTimeout(() => {
    notification.classList.add('fadeout');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 500);
  }, 5000);
};
