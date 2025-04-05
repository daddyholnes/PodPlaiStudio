import express from 'express';
import session from 'express-session';
import path from 'path';
import { createServer } from 'http';
import MemoryStore from 'memorystore';
import { createViteDevServer } from './vite';
import { PORT, SESSION_SECRET, validateConfig } from './config';
import routes, { setupWebSocketServer } from './routes';

// Validate configuration
const configValidation = validateConfig();
if (!configValidation.isValid) {
  console.warn('Configuration issues detected:');
  configValidation.issues.forEach(issue => console.warn(`- ${issue}`));
}

// Create app and HTTP server
const app = express();
const httpServer = createServer(app);

// Set up session store
const MemorySessionStore = MemoryStore(session);
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  },
  store: new MemorySessionStore({
    checkPeriod: 86400000 // 24 hours (in milliseconds)
  })
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API routes
app.use(routes);

// WebSocket server
setupWebSocketServer(httpServer);

// Set up Vite dev server in development
const startServer = async () => {
  // In development, use Vite's dev server
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteDevServer(app);
    
    // Handle all other routes with index.html
    app.use('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        
        // Always read index.html fresh
        let template = await vite.transformIndexHtml(url, '');
        
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (error) {
        vite.ssrFixStacktrace(error as Error);
        next(error);
      }
    });
  } else {
    // In production, serve the static files
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Handle all other routes with index.html
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
  
  // Start the server
  httpServer.listen(PORT, () => {
    console.log(`PodPlay API Studio server running at http://localhost:${PORT}`);
  });
};

startServer().catch(error => {
  console.error('Failed to start server:', error);
});