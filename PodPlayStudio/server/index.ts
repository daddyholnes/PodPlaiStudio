import express from 'express';
import http from 'http';
import path from 'path';
import { json } from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import { SESSION_SECRET } from './config';
import routes, { setupWebSocketServer } from './routes';
import { validateConfig } from './config';

// Check API configuration
const configResult = validateConfig();
// Warn if no API key is found in environment variables
if (!configResult.isApiKeyInEnv) {
  console.warn('No Gemini API key found in environment variables. Please set GEMINI_API_KEY in your Replit Secrets or configure it in the app settings.');
}

// Create Express app
const app = express();
const httpServer = http.createServer(app);

// Setup WebSocket server
setupWebSocketServer(httpServer);

// Session setup
const MemoryStoreSession = MemoryStore(session);
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 86400000 }, // 1 day
    store: new MemoryStoreSession({
      checkPeriod: 86400000, // 1 day
    }),
  })
);

// Middleware
app.use(json());

// Routes
app.use(routes);

// Allow the Vite server to handle static files during development
// In production, serve static files directly
if (process.env.NODE_ENV === 'production') {
  // Serve static files
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

  // Handle React app routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  });
}

export { app, httpServer };