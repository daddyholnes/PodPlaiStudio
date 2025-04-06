const { exec } = require('child_process');
const path = require('path');

// Setup execution routes
const setupExecutionRoutes = (app) => {
  // Execute command
  app.post('/api/execute', (req, res) => {
    const { command, cwd } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }
    
    const workingDirectory = cwd ? path.resolve(cwd) : process.cwd();
    
    console.log(`Executing command: ${command} in ${workingDirectory}`);
    
    exec(command, { cwd: workingDirectory }, (error, stdout, stderr) => {
      if (error) {
        console.error('Execution error:', error);
        return res.status(500).json({
          success: false,
          error: error.message,
          stderr
        });
      }
      
      res.json({
        success: true,
        stdout,
        stderr
      });
    });
  });
};

module.exports = { setupExecutionRoutes };
