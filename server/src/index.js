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

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`LiveKit Server URL: ${process.env.LIVEKIT_SERVER_URL}`);
});
