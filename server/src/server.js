import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config(); // Added to load environment variables

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5050;

// Enable CORS
app.use(cors());

// Parse JSON requests
app.use(express.json());

// API endpoints for terminal
app.post('/api/terminal/sessions', (req, res) => {
  res.status(201).json({
    id: `session-${Date.now()}`,
    created: new Date().toISOString(),
    status: 'active'
  });
});

app.post('/api/terminal/sessions/:id/command', (req, res) => {
  const { command } = req.body;
  res.json({
    output: `Executed: ${command}\nMock output from server`
  });
});

app.post('/api/terminal/sessions/:id/resize', (req, res) => {
  res.sendStatus(204); // No content response
});

// Serve font files with correct MIME type
app.get('/assets/fonts/:filename', (req, res) => {
  const filename = req.params.filename;

  // Check multiple potential locations
  const fontPaths = [
    path.join(__dirname, '../../client/public/assets/fonts', filename),
    path.join(__dirname, '../../client/dist/assets/fonts', filename),
    path.join(__dirname, '../../client/src/assets/fonts', filename)
  ];

  // Try each path until we find the file
  for (const fontPath of fontPaths) {
    if (fs.existsSync(fontPath)) {
      res.setHeader('Content-Type', 'font/woff2');
      return res.sendFile(fontPath);
    }
  }

  // If font not found in any location
  return res.status(404).send('Font not found');
});

// Serve static files from client's dist folder
const distPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Serve from public folder as fallback
const publicPath = path.join(__dirname, '../../client/public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

// LiveKit routes implementation
import { AccessToken } from 'livekit-server-sdk';

const setupLiveKitRoutes = (app) => {
  app.get('/livekit/token', (req, res) => {
    try {
      const { identity, name } = req.query;
      
      // Validate required parameters
      if (!identity) {
        return res.status(400).json({ error: 'Missing identity parameter' });
      }
      
      // Get LiveKit credentials from environment variables
      const apiKey = process.env.LIVEKIT_API_KEY;
      const apiSecret = process.env.LIVEKIT_API_SECRET;
      
      if (!apiKey || !apiSecret) {
        console.error('LiveKit credentials not configured');
        return res.status(500).json({ error: 'LiveKit credentials not configured' });
      }
      
      // Create token with specified identity
      const at = new AccessToken(apiKey, apiSecret, {
        identity: String(identity),
        name: String(name || identity),
      });
      
      // Grant permissions based on application needs
      at.addGrant({ 
        roomJoin: true, 
        room: '*',  // Allow access to any room
        canPublish: true,
        canSubscribe: true 
      });
      
      // Generate the JWT token
      const token = at.toJwt();
      console.log(`Generated token for ${identity}`);
      
      // Return the token to the client
      res.json({ token });
    } catch (error) {
      console.error('Error generating LiveKit token:', error);
      res.status(500).json({ error: 'Failed to generate token' });
    }
  });
};

// Set up routes
setupLiveKitRoutes(app); // Added LiveKit routes

// SPA fallback route
app.get('*', (req, res) => {
  if (fs.existsSync(path.join(distPath, 'index.html'))) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else if (fs.existsSync(path.join(publicPath, 'index.html'))) {
    res.sendFile(path.join(publicPath, 'index.html'));
  } else {
    res.status(404).send('Not found');
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});