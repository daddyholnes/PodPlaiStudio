const express = require('express');
const path = require('path');
const fs = require('fs-extra');

// Setup file routes
const setupFileRoutes = (app) => {
  const router = express.Router();

  // Get file content
  router.get('/api/files', (req, res) => {
    const filePath = req.query.path;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    try {
      const fullPath = path.resolve(filePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      
      res.json({
        path: filePath,
        content,
        success: true
      });
    } catch (error) {
      console.error('Error reading file:', error);
      res.status(500).json({
        error: 'Failed to read file',
        message: error.message
      });
    }
  });

  // Update file content
  router.post('/api/files', (req, res) => {
    const { path: filePath, content } = req.body;
    
    if (!filePath || content === undefined) {
      return res.status(400).json({ error: 'File path and content are required' });
    }
    
    try {
      const fullPath = path.resolve(filePath);
      fs.writeFileSync(fullPath, content, 'utf8');
      
      res.json({
        path: filePath,
        success: true,
        message: 'File updated successfully'
      });
    } catch (error) {
      console.error('Error writing file:', error);
      res.status(500).json({
        error: 'Failed to write file',
        message: error.message
      });
    }
  });

  // List files in directory
  router.get('/api/files/list', (req, res) => {
    const dirPath = req.query.path || '.';
    
    try {
      const fullPath = path.resolve(dirPath);
      const files = fs.readdirSync(fullPath, { withFileTypes: true });
      
      const fileList = files.map(file => ({
        name: file.name,
        path: path.join(dirPath, file.name),
        isDirectory: file.isDirectory()
      }));
      
      res.json({
        path: dirPath,
        files: fileList,
        success: true
      });
    } catch (error) {
      console.error('Error listing files:', error);
      res.status(500).json({
        error: 'Failed to list files',
        message: error.message
      });
    }
  });

  app.use(router);
};

module.exports = { setupFileRoutes };
