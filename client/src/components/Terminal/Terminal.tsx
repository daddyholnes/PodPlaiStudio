import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { TerminalService, TerminalSession, TerminalOutput } from '@/services/terminalService';
import { X, Plus, RefreshCw, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

export const Terminal: React.FC = () => {
  const ws = useWebSocket('/api/terminal');
  const terminalService = useRef<TerminalService>(TerminalService.getInstance(ws));
  
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [commandInput, setCommandInput] = useState<string>('');
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize with a default session if none exists
    if (sessions.length === 0) {
      const defaultSession = terminalService.current.createSession('Terminal 1');
      setSessions([defaultSession]);
      setActiveSessionId(defaultSession.id);
    }
    
    // Set up event listeners
    const unsubscribe = terminalService.current.addEventListener('sessions', (updatedSessions) => {
      setSessions(updatedSessions);
      
      // If active session was removed, select the first available one
      if (updatedSessions.length > 0 && !updatedSessions.find(s => s.id === activeSessionId)) {
        setActiveSessionId(updatedSessions[0].id);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      const unsubscribe = terminalService.current.addEventListener(`session:${activeSessionId}`, (session) => {
        setSessions(prev => prev.map(s => s.id === session.id ? session : s));
        
        // Auto-scroll to bottom
        if (terminalRef.current) {
          setTimeout(() => {
            terminalRef.current!.scrollTop = terminalRef.current!.scrollHeight;
          }, 0);
        }
      });
      
      return () => {
        unsubscribe();
      };
    }
  }, [activeSessionId]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commandInput.trim()) return;
    
    terminalService.current.executeCommand(activeSessionId, commandInput);
    setCommandInput('');
    setHistoryIndex(-1);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const activeSession = sessions.find(s => s.id === activeSessionId);
    
    if (!activeSession) return;
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      
      if (showSuggestions) {
        // Navigate suggestions
        setSuggestions(prev => {
          const selectedIndex = (historyIndex <= 0) ? prev.length - 1 : historyIndex - 1;
          setHistoryIndex(selectedIndex);
          setCommandInput(prev[selectedIndex] || '');
          return prev;
        });
      } else {
        // Navigate history
        const history = activeSession.history;
        const newIndex = historyIndex >= history.length - 1 ? history.length - 1 : historyIndex + 1;
        
        if (history.length > 0 && newIndex >= 0) {
          setHistoryIndex(newIndex);
          setCommandInput(history[history.length - 1 - newIndex].command);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      
      if (showSuggestions) {
        // Navigate suggestions
        setSuggestions(prev => {
          const selectedIndex = (historyIndex >= prev.length - 1) ? 0 : historyIndex + 1;
          setHistoryIndex(selectedIndex);
          setCommandInput(prev[selectedIndex] || '');
          return prev;
        });
      } else {
        // Navigate history
        const history = activeSession.history;
        const newIndex = historyIndex <= 0 ? -1 : historyIndex - 1;
        
        if (newIndex === -1) {
          setCommandInput('');
        } else {
          setCommandInput(history[history.length - 1 - newIndex].command);
        }
        
        setHistoryIndex(newIndex);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      
      if (showSuggestions && suggestions.length > 0) {
        // Use selected suggestion
        setCommandInput(suggestions[historyIndex >= 0 ? historyIndex : 0]);
      } else {
        // Show suggestions
        const newSuggestions = terminalService.current.getCommandSuggestions(commandInput);
        if (newSuggestions.length > 0) {
          setSuggestions(newSuggestions);
          setHistoryIndex(0);
          setShowSuggestions(true);
        }
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === 'c' && e.ctrlKey) {
      // Ctrl+C - Cancel current command
      terminalService.current.executeCommand(activeSessionId, '^C');
      setCommandInput('');
      setHistoryIndex(-1);
    } else if (e.key === 'l' && e.ctrlKey) {
      // Ctrl+L - Clear terminal
      e.preventDefault();
      terminalService.current.clearOutput(activeSessionId);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCommandInput(e.target.value);
    
    // Update auto-completion suggestions
    if (e.target.value.trim()) {
      const newSuggestions = terminalService.current.getCommandSuggestions(e.target.value);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const createNewSession = () => {
    const sessionNumber = sessions.length + 1;
    const newSession = terminalService.current.createSession(`Terminal ${sessionNumber}`);
    setActiveSessionId(newSession.id);
    inputRef.current?.focus();
  };

  const closeSession = (sessionId: string) => {
    terminalService.current.closeSession(sessionId);
    
    // If we're closing the active session, select another one
    if (sessionId === activeSessionId && sessions.length > 1) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      setActiveSessionId(remainingSessions[0].id);
    }
  };

  const clearTerminal = () => {
    terminalService.current.clearOutput(activeSessionId);
  };

  const renderOutput = (output: TerminalOutput[]) => {
    return output.map((item) => {
      // For command inputs
      if (item.text.includes('$')) {
        const [prompt, ...cmdParts] = item.text.split('$');
        const command = cmdParts.join('$').trim();
        
        return (
          <div key={item.id} className="flex py-1">
            <span className="text-green-500">{prompt}$</span>
            <span className="ml-1 text-blue-400">{command}</span>
          </div>
        );
      }
      
      // For command output with potential syntax highlighting
      const shouldHighlight = 
        (item.text.startsWith('{') && item.text.endsWith('}')) || 
        (item.text.startsWith('[') && item.text.endsWith(']')) ||
        item.text.includes('function ') ||
        item.text.includes('import ') ||
        item.text.includes('export ');
      
      if (shouldHighlight) {
        return (
          <div key={item.id} className={item.isError ? "text-red-400" : ""}>
            <SyntaxHighlighter
              language="javascript"
              style={atomOneDark}
              customStyle={{ background: 'transparent', padding: '0' }}
            >
              {item.text}
            </SyntaxHighlighter>
          </div>
        );
      }
      
      // For error messages, add line numbers if available
      if (item.isError) {
        const errorLines = item.text.split('\n');
        
        return (
          <div key={item.id} className="text-red-400">
            {errorLines.map((line, i) => {
              const lineMatch = line.match(/line (\d+)/i);
              if (lineMatch) {
                return (
                  <div key={`${item.id}-${i}`} className="flex">
                    <span className="text-yellow-500">{lineMatch[1]}:</span>
                    <span className="ml-1">{line.replace(/line \d+/i, '')}</span>
                  </div>
                );
              }
              return <div key={`${item.id}-${i}`}>{line}</div>;
            })}
          </div>
        );
      }
      
      // For regular output
      return (
        <div key={item.id} className={item.isError ? "text-red-400" : ""}>
          {item.text}
        </div>
      );
    });
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);
  
  return (
    <div className="flex flex-col h-full border rounded-md overflow-hidden bg-black text-white">
      <Tabs 
        value={activeSessionId} 
        onValueChange={setActiveSessionId}
        className="flex flex-col h-full"
      >
        <div className="flex items-center justify-between p-1 bg-zinc-800 border-b border-zinc-700">
          <TabsList className="bg-zinc-900">
            {sessions.map(session => (
              <div key={session.id} className="flex items-center">
                <TabsTrigger 
                  value={session.id} 
                  className={cn(
                    "px-3 py-1 text-sm",
                    activeSessionId === session.id 
                      ? "bg-black text-white" 
                      : "bg-zinc-800 text-zinc-400"
                  )}
                >
                  {session.title}
                </TabsTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 rounded-full p-0 text-zinc-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeSession(session.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="ml-1 text-zinc-400"
              onClick={createNewSession}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TabsList>
          
          <div className="flex">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={clearTerminal}>
                  <Trash2 className="h-4 w-4 text-zinc-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear Terminal</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    // Restart the terminal session
                    const sessionId = activeSessionId;
                    terminalService.current.closeSession(sessionId);
                    const newSession = terminalService.current.createSession(
                      activeSession ? activeSession.title : 'Terminal'
                    );
                    setActiveSessionId(newSession.id);
                  }}
                >
                  <RefreshCw className="h-4 w-4 text-zinc-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Restart Terminal</TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {sessions.map(session => (
            <TabsContent 
              key={session.id} 
              value={session.id}
              className="p-0 m-0 h-full flex flex-col"
            >
              <div 
                ref={terminalRef}
                className="flex-1 overflow-y-auto p-2 font-mono text-sm whitespace-pre-wrap"
              >
                {renderOutput(session.output)}
              </div>
              
              <form onSubmit={handleCommandSubmit} className="border-t border-zinc-800 p-2">
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">
                    {session.cwd}$
                  </span>
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={commandInput}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-transparent outline-none"
                      autoFocus
                    />
                    
                    {/* Auto-completion dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute bottom-full left-0 mb-1 bg-zinc-800 border border-zinc-700 rounded w-full max-h-40 overflow-y-auto z-10">
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={suggestion}
                            className={cn(
                              "px-2 py-1 cursor-pointer hover:bg-zinc-700",
                              historyIndex === index ? "bg-zinc-700" : ""
                            )}
                            onClick={() => {
                              setCommandInput(suggestion);
                              setShowSuggestions(false);
                              inputRef.current?.focus();
                            }}
                          >
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
};

export default Terminal;
