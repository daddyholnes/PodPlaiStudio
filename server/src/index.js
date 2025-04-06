import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import terminalRoutes from './routes/terminalRoutes.js';
import fs from 'fs';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Set Content Security Policy
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
  },
}));

const PORT = process.env.PORT || 5050;

// Middlewares
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/terminal', terminalRoutes);

// Serve static files from client/dist in production
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.woff2')) {
      res.setHeader('Content-Type', 'font/woff2');
    }
  }
}));

// Serve static files from client/public in development
app.use(express.static(path.join(__dirname, '../../client/public')));

// Create a special route to serve fonts with proper headers
app.get('/assets/fonts/:fontFile', (req, res) => {
  const fontPaths = [
    path.join(__dirname, '../../client/dist/assets/fonts', req.params.fontFile),
    path.join(__dirname, '../../client/public/assets/fonts', req.params.fontFile)
  ];
  
  // Try to find the font in either location
  let fontFound = false;
  for (const fontPath of fontPaths) {
    if (fs.existsSync(fontPath)) {
      res.setHeader('Content-Type', 'font/woff2');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
      res.sendFile(fontPath);
      fontFound = true;
      break;
    }
  }
  
  // If font not found, send 404
  if (!fontFound) {
    res.status(404).send('Font not found');
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Your existing socket.io and route handling code here
