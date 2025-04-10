import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config(); // Added to load environment variables

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// Setup Google Cloud credentials if they exist in environment variables
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  try {
    const tempCredPath = path.join(__dirname, 'google-credentials-temp.json');
    fs.writeFileSync(tempCredPath, process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tempCredPath;
    console.log('Google Cloud credentials configured from environment variable');
  } catch (error) {
    console.error('Error setting up Google credentials:', error);
  }
}

// Enable CORS with specific configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'https://dartopia.repl.co', 'https://dartopia-gvu1e64v.livekit.cloud', 'wss://dartopia-gvu1e64v.livekit.cloud'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'livekit-signature']
}));

// Handle preflight requests
app.options('*', cors());

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

// Import LiveKit routes
import livekitRoutes from './routes/livekit.js';

// Debug middleware for webhook requests
app.use('/api/livekit/webhook', (req, res, next) => {
  console.log('Webhook request received at:', new Date().toISOString());
  console.log('Request URL:', req.originalUrl);
  console.log('Request method:', req.method);
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('Request body:', JSON.stringify(req.body, null, 2)); // Added to log request body
  next();
});

// Set up routes
app.use('/api/livekit', livekitRoutes); // Use the LiveKit routes

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
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});