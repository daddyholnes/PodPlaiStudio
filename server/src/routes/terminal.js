const express = require('express');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Store terminal sessions
const sessions = new Map();

// Create a simulated terminal service - purely JavaScript implementation, no external dependencies
class SimulatedTerminal {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.cwd = process.cwd();
    this.env = { ...process.env };
    this.onData = null;
    this.onExit = null;
    this.history = [];
  }

  write(data) {
    if (this.onData) {
      // Simulate response with a slight delay
      setTimeout(() => {
        // Process the command
        const output = this.processCommand(data.toString().trim());
        this.onData(output);
      }, 50);
    }
  }

  processCommand(command) {
    // Store command in history
    if (command) {
      this.history.push(command);
    }
    
    // Simple command simulation
    if (command.startsWith('cd ')) {
      const dir = command.substring(3);
      try {
        const newDir = path.resolve(this.cwd, dir);
        if (fs.existsSync(newDir) && fs.statSync(newDir).isDirectory()) {
          this.cwd = newDir;
          return `Changed directory to ${this.cwd}\r\n`;
        } else {
          return `Error: Directory not found: ${dir}\r\n`;
        }
      } catch (error) {
        return `Error: ${error.message}\r\n`;
      }
    }
    
    if (command === 'ls' || command === 'dir') {
      try {
        const files = fs.readdirSync(this.cwd);
        return files.join('\r\n') + '\r\n';
      } catch (error) {
        return `Error: ${error.message}\r\n`;
      }
    }
    
    if (command === 'pwd') {
      return `${this.cwd}\r\n`;
    }
    
    if (command.startsWith('echo ')) {
      const text = command.substring(5);
      return `${text}\r\n`;
    }
    
    if (command === 'date') {
      return `${new Date().toString()}\r\n`;
    }
    
    if (command.startsWith('node ') || command === 'node') {
      return '[Simulated Node.js execution]\r\n';
    }
    
    if (command.startsWith('python ') || command === 'python') {
      return '[Simulated Python execution]\r\n';
    }
    
    if (command === 'history') {
      return this.history.map((cmd, i) => `${i+1}  ${cmd}`).join('\r\n') + '\r\n';
    }
    
    if (command === 'clear' || command === 'cls') {
      return '\x1Bc'; // ANSI escape sequence to clear the screen
    }
    
    if (command === 'help') {
      return `Available commands:
  cd <directory> - Change directory
  ls, dir - List files
  pwd - Print working directory
  echo <text> - Print text
  date - Show current date and time
  clear, cls - Clear the screen
  history - Show command history
  node - Simulate Node.js execution
  python - Simulate Python execution
  help - Show this help message
\r\n`;
    }

    // For any other command, return a simulated response
    return `Simulated execution of command: ${command}\r\n`;
  }

  kill() {
    // Clean up resources
    if (this.onExit) {
      this.onExit(0);
    }
  }

  resize(cols, rows) {
    // Nothing to do for simulated terminal
  }
}

// Set up terminal routes
const setupTerminalRoutes = (app, wss) => {
  const router = express.Router();

  // Create a new terminal session
  router.post('/sessions', (req, res) => {
    const sessionId = uuidv4();
    const terminal = new SimulatedTerminal(sessionId);
    
    sessions.set(sessionId, terminal);
    
    console.log(`Created new terminal session: ${sessionId}`);
    res.status(201).json({ sessionId });
  });

  // Execute a command in a terminal session
  router.post('/execute', (req, res) => {
    const { command, sessionId } = req.body;
    
    if (!sessionId || !sessions.has(sessionId)) {
      return res.status(404).json({ error: 'Terminal session not found' });
    }
    
    const terminal = sessions.get(sessionId);
    
    try {
      // Set up a one-time data handler to capture output
      let output = '';
      const originalOnData = terminal.onData;
      
      terminal.onData = (data) => {
        output += data;
      };
      
      // Write the command
      terminal.write(command + '\r');
      
      // Wait a bit for the simulated command to complete
      setTimeout(() => {
        terminal.onData = originalOnData;
        res.json({ output });
      }, 100);
    } catch (error) {
      console.error('Error executing command:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Terminate a terminal session
  router.delete('/sessions/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    
    if (!sessions.has(sessionId)) {
      return res.status(404).json({ error: 'Terminal session not found' });
    }
    
    const terminal = sessions.get(sessionId);
    terminal.kill();
    sessions.delete(sessionId);
    
    console.log(`Terminated terminal session: ${sessionId}`);
    res.status(204).end();
  });

  // Set up WebSocket handlers for terminal
  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = url.pathname.split('/').pop();
    
    if (sessionId && sessions.has(sessionId)) {
      console.log(`WebSocket connected for terminal session: ${sessionId}`);
      
      const terminal = sessions.get(sessionId);
      
      terminal.onData = (data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      };
      
      terminal.onExit = (code) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
      
      ws.on('message', (data) => {
        try {
          terminal.write(data);
        } catch (error) {
          console.error('Error processing terminal message:', error);
        }
      });
      
      ws.on('close', () => {
        console.log(`WebSocket closed for terminal session: ${sessionId}`);
      });
    } else {
      console.log(`WebSocket terminal session not found: ${sessionId || 'no-session-id'}`);
      ws.close();
    }
  });

  app.use('/api/terminal', router);
};

module.exports = { setupTerminalRoutes };
