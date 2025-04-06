import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5050;

// Serve static files from the client/dist directory
app.use(express.static(path.join(__dirname, 'client/dist'), {
  setHeaders: (res, filePath) => {
    // Add proper cache headers for static assets
    if (filePath.endsWith('.js') || filePath.endsWith('.css') || 
        filePath.endsWith('.woff2') || filePath.endsWith('.jpg') || 
        filePath.endsWith('.png')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    }
  }
}));

// Create a dedicated route for fonts with proper headers
app.get('/assets/fonts/:fontFile', (req, res) => {
  const fontPath = path.join(__dirname, 'client/dist/assets/fonts', req.params.fontFile);
  
  if (fs.existsSync(fontPath)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    res.setHeader('Content-Type', 'font/woff2');
    res.sendFile(fontPath);
  } else {
    res.status(404).send('Font not found');
  }
});

// For all other routes, serve the index.html file (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
