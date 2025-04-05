import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { apiRequest } from '@/lib/queryClient';

interface EnhancedTerminalProps {
  sessionId: string;
  onError?: (error: string, lineNumber: number) => void;
}

const TERMINAL_COLORS = {
  RESET: '\x1b[0m',
  BRIGHT_RED: '\x1b[91m',
  BRIGHT_GREEN: '\x1b[92m',
  BRIGHT_YELLOW: '\x1b[93m',
  BRIGHT_BLUE: '\x1b[94m',
  BRIGHT_MAGENTA: '\x1b[95m',
  BRIGHT_CYAN: '\x1b[96m',
};

const EnhancedTerminal: React.FC<EnhancedTerminalProps> = ({ sessionId, onError }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
  const inProgressRef = useRef(false);
  const commandHistoryRef = useRef<string[]>([]);
  const errorPatternsRef = useRef([
    { pattern: /error at line (\d+)/i, extractLineNumber: (match: RegExpMatchArray) => parseInt(match[1], 10) },
    { pattern: /line (\d+): error/i, extractLineNumber: (match: RegExpMatchArray) => parseInt(match[1], 10) },
  ]);

  useEffect(() => {
    if (terminalRef.current) {
      const terminal = new Terminal({
        cursorBlink: true,
        fontFamily: 'monospace',
        fontSize: 14,
        theme: {
          background: '#1e1e1e',
          foreground: '#ffffff',
        },
      });

      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();

      terminal.loadAddon(fitAddon);
      terminal.loadAddon(webLinksAddon);
      terminal.open(terminalRef.current);
      fitAddon.fit();

      terminalInstanceRef.current = terminal;

      terminal.writeln(`${TERMINAL_COLORS.BRIGHT_GREEN}Welcome to the Enhanced Terminal!${TERMINAL_COLORS.RESET}`);
      terminal.write('$ ');

      terminal.onData((data) => {
        if (inProgressRef.current) return;

        const command = data.trim();
        if (command) {
          commandHistoryRef.current.push(command);
          processCommand(command);
        }
      });

      const connectWebSocket = () => {
        if (webSocketRef.current) {
          webSocketRef.current.close();
        }

        const endpoint = `${window.location.protocol}//${window.location.host}/ws/terminal/${sessionId}`;

        try {
          webSocketRef.current = new WebSocket(endpoint);

          webSocketRef.current.onopen = () => {
            console.log('Terminal WebSocket connected');
            terminalInstanceRef.current?.writeln(`${TERMINAL_COLORS.BRIGHT_GREEN}WebSocket connected${TERMINAL_COLORS.RESET}`);
          };

          webSocketRef.current.onclose = (event) => {
            console.log(`Terminal WebSocket closed: ${event.code} ${event.reason}`);
            terminalInstanceRef.current?.writeln(`\r\n${TERMINAL_COLORS.BRIGHT_RED}Connection closed. Trying to reconnect...${TERMINAL_COLORS.RESET}`);

            setTimeout(() => {
              connectWebSocket();
            }, 3000);
          };

          webSocketRef.current.onerror = (error) => {
            console.error('Terminal WebSocket error:', error);
            terminalInstanceRef.current?.writeln(`\r\n${TERMINAL_COLORS.BRIGHT_RED}WebSocket error. Connection might be unstable.${TERMINAL_COLORS.RESET}`);
          };

          webSocketRef.current.onmessage = (event) => {
            const output = event.data;
            if (terminalInstanceRef.current) {
              if (typeof output === 'string' && output.toLowerCase().includes('error')) {
                for (const { pattern, extractLineNumber } of errorPatternsRef.current) {
                  const match = output.match(pattern);
                  if (match) {
                    const lineNumber = extractLineNumber(match);
                    if (lineNumber && onError) {
                      onError(output, lineNumber);
                    }
                    break;
                  }
                }

                if (output.toLowerCase().includes('error') || output.toLowerCase().includes('exception')) {
                  terminalInstanceRef.current.write(`${TERMINAL_COLORS.BRIGHT_RED}${output}${TERMINAL_COLORS.RESET}`);
                  return;
                }
              }

              const jsKeywords = /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await)\b/g;
              const withJsHighlighting = output.replace(
                jsKeywords,
                `${TERMINAL_COLORS.BRIGHT_MAGENTA}$1${TERMINAL_COLORS.RESET}`
              );

              const stringPattern = /("[^"]*"|'[^']*'|`[^`]*`)/g;
              const withStringHighlighting = withJsHighlighting.replace(
                stringPattern,
                `${TERMINAL_COLORS.BRIGHT_GREEN}$1${TERMINAL_COLORS.RESET}`
              );

              const numberPattern = /\b(\d+)\b/g;
              const withNumberHighlighting = withStringHighlighting.replace(
                numberPattern,
                `${TERMINAL_COLORS.BRIGHT_CYAN}$1${TERMINAL_COLORS.RESET}`
              );

              terminalInstanceRef.current.write(withNumberHighlighting);
            }
          };
        } catch (error) {
          console.error('Error creating Terminal WebSocket:', error);
          if (terminalInstanceRef.current) {
            terminalInstanceRef.current.writeln(`\r\n${TERMINAL_COLORS.BRIGHT_RED}Failed to connect to terminal service. Using fallback mode.${TERMINAL_COLORS.RESET}`);
          }
        }
      };

      connectWebSocket();
    }

    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.dispose();
      }
    };
  }, [sessionId, onError]);

  const processCommand = async (command: string): Promise<void> => {
    if (command.trim() === 'clear' || command.trim() === 'cls') {
      terminalInstanceRef.current?.clear();
      terminalInstanceRef.current?.write('$ ');
      return;
    }

    inProgressRef.current = true;

    if (command.trim() === 'help') {
      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.writeln(`
${TERMINAL_COLORS.BRIGHT_CYAN}Available commands:${TERMINAL_COLORS.RESET}
  ${TERMINAL_COLORS.BRIGHT_GREEN}clear, cls${TERMINAL_COLORS.RESET}       - Clear the terminal
  ${TERMINAL_COLORS.BRIGHT_GREEN}help${TERMINAL_COLORS.RESET}             - Show this help message
  ${TERMINAL_COLORS.BRIGHT_GREEN}history${TERMINAL_COLORS.RESET}          - Show command history
  ${TERMINAL_COLORS.BRIGHT_GREEN}node <file.js>${TERMINAL_COLORS.RESET}   - Run JavaScript file
  ${TERMINAL_COLORS.BRIGHT_GREEN}python <file.py>${TERMINAL_COLORS.RESET} - Run Python file
  ${TERMINAL_COLORS.BRIGHT_GREEN}npm <command>${TERMINAL_COLORS.RESET}    - Run npm commands

Use ${TERMINAL_COLORS.BRIGHT_YELLOW}Ctrl+C${TERMINAL_COLORS.RESET} to interrupt a running command
Use ${TERMINAL_COLORS.BRIGHT_YELLOW}Up/Down arrows${TERMINAL_COLORS.RESET} to navigate command history
`);
        terminalInstanceRef.current.write('$ ');
        inProgressRef.current = false;
        return;
      }
    }

    if (command.trim() === 'history') {
      if (terminalInstanceRef.current) {
        if (commandHistoryRef.current.length === 0) {
          terminalInstanceRef.current.writeln(`No command history yet.`);
        } else {
          terminalInstanceRef.current.writeln(`${TERMINAL_COLORS.BRIGHT_CYAN}Command history:${TERMINAL_COLORS.RESET}`);
          commandHistoryRef.current.forEach((cmd, i) => {
            terminalInstanceRef.current?.writeln(`  ${i + 1}: ${cmd}`);
          });
        }
        terminalInstanceRef.current.write('$ ');
        inProgressRef.current = false;
        return;
      }
    }

    try {
      if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
        webSocketRef.current.send(command);
      } else {
        const response = await apiRequest('/api/terminal/execute', 'POST', {
          command,
          sessionId
        });

        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.writeln(response.output);
          terminalInstanceRef.current.write('$ ');
        }
      }
    } catch (error) {
      console.error('Error executing command:', error);
      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.writeln(`${TERMINAL_COLORS.BRIGHT_RED}Error: Failed to execute command${TERMINAL_COLORS.RESET}`);
        terminalInstanceRef.current.write('$ ');
      }
    } finally {
      inProgressRef.current = false;
    }
  };

  return (
    <div
      className="terminal-container"
      ref={terminalRef}
      style={{ height: '100%', width: '100%' }}
      aria-label="Terminal"
      role="region"
    />
  );
};

export default EnhancedTerminal;