const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');

// Store active terminal sessions
const terminalSessions = new Map();

// Set up terminal WebSocket handling
const setupTerminalWebSocket = (wss) => {
  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');
    
    let sessionId = null;
    let terminalProcess = null;
    
    // Handle messages from client
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        
        // Handle different message types
        switch (data.type) {
          case 'create':
            // Create new terminal session
            sessionId = uuidv4();
            console.log(`Creating new terminal session: ${sessionId}`);
            
            // Determine shell command based on OS
            const shellCmd = process.platform === 'win32' ? 'cmd.exe' : 'bash';
            const shellArgs = process.platform === 'win32' ? [] : [];
            
            // Spawn terminal process
            terminalProcess = spawn(shellCmd, shellArgs, {
              cwd: process.cwd(),
              env: process.env,
              shell: true
            });
            
            // Store session
            terminalSessions.set(sessionId, {
              process: terminalProcess,
              ws
            });
            
            // Send session ID back to client
            ws.send(JSON.stringify({
              type: 'session',
              sessionId
            }));
            
            // Handle terminal output
            terminalProcess.stdout.on('data', (data) => {
              if (ws.readyState === 1) { // WebSocket.OPEN
                ws.send(JSON.stringify({
                  type: 'output',
                  output: data.toString(),
                  sessionId
                }));
              }
            });
            
            terminalProcess.stderr.on('data', (data) => {
              if (ws.readyState === 1) { // WebSocket.OPEN
                ws.send(JSON.stringify({
                  type: 'output',
                  output: data.toString(),
                  sessionId
                }));
              }
            });
            
            terminalProcess.on('exit', (code) => {
              console.log(`Terminal session ${sessionId} exited with code ${code}`);
              if (ws.readyState === 1) { // WebSocket.OPEN
                ws.send(JSON.stringify({
                  type: 'exit',
                  code,
                  sessionId
                }));
              }
              terminalSessions.delete(sessionId);
            });
            
            break;
            
          case 'connect':
            // Connect to existing session
            sessionId = data.sessionId;
            const existingSession = terminalSessions.get(sessionId);
            
            if (existingSession) {
              console.log(`Connecting to existing terminal session: ${sessionId}`);
              existingSession.ws = ws;
              terminalProcess = existingSession.process;
            } else {
              console.error(`Session ${sessionId} not found`);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Session not found'
              }));
            }
            
            break;
            
          case 'input':
            // Send input to terminal process
            if (terminalProcess && terminalProcess.stdin.writable && data.sessionId === sessionId) {
              terminalProcess.stdin.write(data.input);
            } else {
              console.error('Cannot write to terminal or invalid session');
            }
            
            break;
            
          case 'resize':
            // Resize terminal
            if (terminalProcess && data.sessionId === sessionId) {
              // Implement terminal resize if needed
              // terminalProcess.stdout.columns = data.cols;
              // terminalProcess.stdout.rows = data.rows;
            }
            
            break;
            
          default:
            console.error(`Unknown message type: ${data.type}`);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle WebSocket close
    ws.on('close', () => {
      console.log('WebSocket connection closed');
      
      // Keep the process running but update the session info
      if (sessionId && terminalSessions.has(sessionId)) {
        const session = terminalSessions.get(sessionId);
        
        // Only delete if this is the current active WebSocket
        if (session.ws === ws) {
          console.log(`Marking terminal session ${sessionId} as disconnected`);
          session.ws = null;
          
          // Optional: Set a timeout to kill the process if not reconnected
          setTimeout(() => {
            const currentSession = terminalSessions.get(sessionId);
            if (currentSession && currentSession.ws === null) {
              console.log(`Cleaning up abandoned terminal session: ${sessionId}`);
              if (currentSession.process) {
                currentSession.process.kill();
              }
              terminalSessions.delete(sessionId);
            }
          }, 60000); // 1 minute timeout
        }
      }
    });
    
    // Handle WebSocket errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
};

module.exports = { setupTerminalWebSocket };
