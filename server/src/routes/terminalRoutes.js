import { Router } from 'express';

const router = Router();

// Mock terminal session data
const sessions = {};

// Create terminal session
router.post('/sessions', (req, res) => {
  const sessionId = `session-${Date.now()}`;
  sessions[sessionId] = {
    id: sessionId,
    created: new Date().toISOString(),
    status: 'active',
    commands: []
  };
  
  res.status(201).json(sessions[sessionId]);
});

// Execute command in terminal session
router.post('/sessions/:id/command', (req, res) => {
  const { id } = req.params;
  const { command } = req.body;
  
  if (!sessions[id]) {
    return res.status(404).json({ error: 'Terminal session not found' });
  }
  
  // Store command
  sessions[id].commands.push(command);
  
  // Mock response - in a real implementation, this would execute the command
  const output = `Executed: ${command}\nOutput: Mock response from server`;
  
  res.json({ output });
});

// Resize terminal
router.post('/sessions/:id/resize', (req, res) => {
  const { id } = req.params;
  const { cols, rows } = req.body;
  
  if (!sessions[id]) {
    return res.status(404).json({ error: 'Terminal session not found' });
  }
  
  // Update terminal size
  sessions[id].size = { cols, rows };
  
  res.sendStatus(204);
});

export default router;
