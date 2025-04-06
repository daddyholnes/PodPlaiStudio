require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const { setupLiveKitRoutes } = require('./routes/livekit');
const { setupFileRoutes } = require('./routes/files');
const { setupExecutionRoutes } = require('./routes/execution');
const { setupTerminalWebSocket } = require('./services/terminalService');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up routes
setupLiveKitRoutes(app);
setupFileRoutes(app);
setupExecutionRoutes(app);

// Set up WebSocket for terminal
setupTerminalWebSocket(wss);

// Serve static files from client build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Use a different port range (5050-5100) to avoid conflicts
const BASE_PORT = process.env.PORT || 5050;
const MAX_PORT_ATTEMPTS = 50;

// Try to start server on available port
function findAndStartOnAvailablePort(attempt = 0) {
  const port = BASE_PORT + attempt;
  
  // Stop trying after too many attempts
  if (attempt >= MAX_PORT_ATTEMPTS) {
    console.error(`Failed to find an available port after ${MAX_PORT_ATTEMPTS} attempts`);
    process.exit(1);
    return;
  }
  
  try {
    server.listen(port);
    
    server.on('listening', () => {
      console.log(`Server running on port ${port}`);
      console.log(`LiveKit Server URL: ${process.env.LIVEKIT_SERVER_URL || 'not configured'}`);
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is already in use, trying next port...`);
        // Try next port
        findAndStartOnAvailablePort(attempt + 1);
      } else {
        console.error('Server error:', err);
      }
    });
  } catch (error) {
    console.error('Error starting server:', error);
    findAndStartOnAvailablePort(attempt + 1);
  }
}

// Start the server
findAndStartOnAvailablePort();
