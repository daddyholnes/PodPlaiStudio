import React, { useEffect, useRef, useState, useContext } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { sendTerminalCommand, createTerminalSession } from '../../services/terminalService';
import { TerminalContext } from '../../App';
import '@xterm/xterm/css/xterm.css';

const XtermTerminal = ({ sessionId, onSessionCreate }) => {
  const terminalRef = useRef(null);
  const terminalInstanceRef = useRef(null);
  const fitAddonRef = useRef(null);
  const commandBufferRef = useRef('');
  const webSocketRef = useRef(null);
  
  // Get terminal context if available
  const terminalContext = useContext(TerminalContext);
  const contextSessionId = terminalContext?.session?.id;
  
  // Use provided sessionId or fall back to context
  const effectiveSessionId = sessionId || contextSessionId;
  
  // Initialize terminal if needed
  useEffect(() => {
    const initSession = async () => {
      if (!effectiveSessionId && onSessionCreate) {
        try {
          const session = await createTerminalSession();
          onSessionCreate(session);
        } catch (error) {
          console.error('Failed to create terminal session:', error);
        }
      }
    };
    
    initSession();
  }, [effectiveSessionId, onSessionCreate]);

  useEffect(() => {
    // Only initialize the terminal if we have a DOM element to attach to
    if (!terminalRef.current) return;
    
    // Initialize terminal
    const terminal = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#1e1e1e',
        foreground: '#f0f0f0',
        cursor: '#ffffff',
      },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      convertEol: true,
    });

    terminalInstanceRef.current = terminal;

    // Initialize fit addon to auto-resize terminal
    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    terminal.loadAddon(fitAddon);

    // Initialize web links addon to make URLs clickable
    const webLinksAddon = new WebLinksAddon();
    terminal.loadAddon(webLinksAddon);

    // Open terminal in the container
    terminal.open(terminalRef.current);
    fitAddon.fit();

    // Connect to WebSocket for terminal communications
    if (effectiveSessionId) {
      connectWebSocket(effectiveSessionId);
    }

    // Welcome message
    terminal.writeln('Welcome to PodPlai Studio Terminal');
    terminal.writeln(`Session ID: ${effectiveSessionId || 'Not connected'}`);
    terminal.writeln('Type "help" for available commands');
    terminal.write('\r\n$ ');

    // Handle terminal input
    terminal.onData((data) => {
      // If Enter key is pressed
      if (data === '\r') {
        const command = commandBufferRef.current.trim();
        terminal.writeln('');
        processCommand(command);
        commandBufferRef.current = '';
        terminal.write('$ ');
      } 
      // If Backspace key is pressed
      else if (data === '\x7f') {
        if (commandBufferRef.current.length > 0) {
          commandBufferRef.current = commandBufferRef.current.substring(0, commandBufferRef.current.length - 1);
          terminal.write('\b \b');
        }
      } 
      // Otherwise add the character to the buffer and echo it
      else {
        commandBufferRef.current += data;
        terminal.write(data);
      }
    });

    // Handle resize events
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      // Cleanup
      window.removeEventListener('resize', handleResize);
      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.dispose();
      }
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
  }, [effectiveSessionId]);

  const connectWebSocket = (sessionId) => {
    // Create a simulated terminal connection since we don't have node-pty anymore
    console.log('Simulating terminal WebSocket connection for session:', sessionId);
    
    // For demo, we'll use a fake websocket that simulates responses
    webSocketRef.current = {
      readyState: WebSocket.OPEN,
      send: (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          if (parsedMessage.type === 'command') {
            setTimeout(() => {
              const fakeResponse = `Simulated output for: ${parsedMessage.content}\n`;
              if (terminalInstanceRef.current) {
                terminalInstanceRef.current.write(fakeResponse);
              }
            }, 100);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      },
      close: () => console.log('Terminal WebSocket disconnected')
    };
  };

  const processCommand = async (command) => {
    if (!command) return;
    
    if (command === 'clear') {
      terminalInstanceRef.current.clear();
      return;
    }
    
    if (command === 'help') {
      terminalInstanceRef.current.writeln('Available commands:');
      terminalInstanceRef.current.writeln('  help     - Show this help message');
      terminalInstanceRef.current.writeln('  clear    - Clear the terminal');
      terminalInstanceRef.current.writeln('  python   - Execute Python code (simulated)');
      terminalInstanceRef.current.writeln('  node     - Execute JavaScript code with Node.js (simulated)');
      terminalInstanceRef.current.writeln('  ls       - List files in current directory (simulated)');
      return;
    }
    
    try {
      if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
        webSocketRef.current.send(JSON.stringify({ type: 'command', content: command }));
      } else if (effectiveSessionId) {
        // Fallback to HTTP API
        const response = await sendTerminalCommand(effectiveSessionId, command);
        terminalInstanceRef.current.writeln(response.output || `Executed: ${command}`);
      } else {
        // No connection at all
        terminalInstanceRef.current.writeln(`Error: No active terminal session`);
      }
    } catch (error) {
      terminalInstanceRef.current.writeln(`Error: ${error.message || 'Failed to execute command'}`);
    }
  };

  return (
    <div 
      className="terminal-container" 
      ref={terminalRef} 
      style={{ 
        height: '100%', 
        width: '100%',
        backgroundColor: '#1e1e1e',
        border: '1px solid #444',
        borderRadius: '4px',
        overflow: 'hidden'
      }}
      aria-label="Terminal"
      role="region"
    />
  );
};

export default XtermTerminal;
