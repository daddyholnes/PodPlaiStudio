import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '../../client/dist');

export function setupStaticServer(app) {
  // Check if the dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    console.warn(`⚠️ Warning: Client build directory not found at ${DIST_DIR}`);
    console.warn('Run "npm run build" to build the client first');
    return;
  }

  // Serve static assets with proper cache control
  app.use(express.static(DIST_DIR, {
    setHeaders: (res, filePath) => {
      // Set cache headers for static assets
      if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
      } else if (filePath.endsWith('.woff2') || filePath.endsWith('.woff')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
      } else if (filePath.endsWith('.png') || filePath.endsWith('.jpg') || filePath.endsWith('.gif')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
      }
    }
  }));

  // For all other routes, serve the index.html file (for SPA client-side routing)
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });

  console.log(`✅ Static server set up to serve files from ${DIST_DIR}`);
}
