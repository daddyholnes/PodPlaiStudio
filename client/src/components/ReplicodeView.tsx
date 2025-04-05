import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Editor } from '@monaco-editor/react';
import { useGemini } from '@/hooks/use-gemini';
import { apiRequest } from '@/lib/queryClient';
import { useFileSystem } from '@/hooks/use-file-system';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { toast } from '@/hooks/use-toast';
import EnhancedTerminal from './Terminal/EnhancedTerminal';
import ProjectExplorer from './FileExplorer/ProjectExplorer';
import { useGeminiCodeAssistant } from '@/hooks/use-gemini-code-assistant';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';

// Language map for syntax highlighting
const LANGUAGE_MAP: Record<string, string> = {
  'js': 'javascript',
  'jsx': 'javascript',
  'ts': 'typescript',
  'tsx': 'typescript',
  'html': 'html',
  'css': 'css',
  'json': 'json',
  'md': 'markdown',
  'py': 'python',
  'rb': 'ruby',
  'go': 'go',
  'rs': 'rust',
  'java': 'java',
  'c': 'c',
  'cpp': 'cpp',
  'cs': 'csharp',
  'php': 'php',
};

const ReplicodeView: React.FC = () => {
  // Terminal session
  const [terminalSessionId, setTerminalSessionId] = useState<string>('');
  
  // File state
  const { 
    files,
    currentFile,
    fileContent,
    setFileContent,
    saveFile,
    createFile,
    renameFile,
    deleteFile,
    selectFile,
    createFolder,
    activeProject,
    setActiveProject,
    getLanguageFromFilename
  } = useFileSystem();
  
  // Editor theme
  const [theme, setTheme] = useState('vs-dark');
  const editorRef = useRef<any>(null);
  
  // AI Code Assistant
  const { generateCode, modifyCode, explainCode, isProcessing } = useGeminiCodeAssistant();
  
  // Panel sizes
  const [leftPanelSize, setLeftPanelSize] = useLocalStorage('replicode-left-panel-size', 20);
  const [bottomPanelSize, setBottomPanelSize] = useLocalStorage('replicode-bottom-panel-size', 30);
  
  // Create terminal session on mount
  useEffect(() => {
    const initTerminal = async () => {
      try {
        const response = await apiRequest('/api/terminal/sessions', 'POST');
        setTerminalSessionId(response.sessionId);
      } catch (error) {
        console.error('Failed to create terminal session:', error);
        toast({
          title: 'Terminal Error',
          description: 'Failed to initialize terminal. Some features may not work properly.',
          variant: 'destructive'
        });
      }
    };
    
    initTerminal();
    
    return () => {
      // Cleanup terminal session on unmount
      if (terminalSessionId) {
        apiRequest(`/api/terminal/sessions/${terminalSessionId}`, 'DELETE')
          .catch(err => console.error('Error closing terminal session:', err));
      }
    };
  }, []);
  
  // Handle editor mounted event
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Configure editor
    editor.addAction({
      id: 'run-code',
      label: 'Run Code',
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter
      ],
      run: () => executeCode()
    });
    
    // Add more custom actions and keyboard shortcuts
    editor.addAction({
      id: 'explain-code',
      label: 'Explain Code',
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyE
      ],
      run: () => {
        const selection = editor.getSelection();
        const selectedText = selection ? editor.getModel().getValueInRange(selection) : '';
        if (selectedText) {
          explainCode(selectedText);
        } else {
          explainCode(fileContent);
        }
      }
    });
    
    // Format code
    editor.addAction({
      id: 'format-code',
      label: 'Format Code',
      keybindings: [
        monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF
      ],
      run: () => {
        editor.getAction('editor.action.formatDocument').run();
      }
    });
  };
  
  // Execute code in the terminal
  const executeCode = async () => {
    if (!currentFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to run',
        variant: 'default'
      });
      return;
    }
    
    // Save file before execution
    await saveFile(currentFile.path, fileContent);
    
    // Get file extension
    const extension = currentFile.path.split('.').pop()?.toLowerCase() || '';
    
    // Determine execution command based on file type
    let command = '';
    switch (extension) {
      case 'js':
        command = `node "${currentFile.path}"`;
        break;
      case 'ts':
        command = `npx tsx "${currentFile.path}"`;
        break;
      case 'py':
        command = `python "${currentFile.path}"`;
        break;
      case 'html':
        toast({
          title: 'HTML files',
          description: 'HTML files can be previewed in the browser pane',
          variant: 'default'
        });
        return;
      default:
        toast({
          title: 'Unsupported file type',
          description: `Cannot execute files with .${extension} extension`,
          variant: 'default'
        });
        return;
    }
    
    // Send the execution command to the terminal
    if (terminalSessionId) {
      // First clear the terminal
      await apiRequest('/api/terminal/execute', 'POST', {
        command: 'clear',
        sessionId: terminalSessionId
      });
      
      // Then execute the code
      await apiRequest('/api/terminal/execute', 'POST', {
        command,
        sessionId: terminalSessionId
      });
    }
  };
  
  // Handle file content change
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setFileContent(value);
    }
  };
  
  // Get editor language based on file extension
  const getEditorLanguage = () => {
    if (!currentFile) return 'javascript';
    
    const extension = currentFile.path.split('.').pop()?.toLowerCase();
    if (!extension) return 'javascript';
    
    return LANGUAGE_MAP[extension] || 'javascript';
  };
  
  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-neutral-900">
      <div className="flex items-center justify-between p-2 border-b border-neutral-300 dark:border-neutral-700">
        <div className="flex items-center">
          <h3 className="font-medium mr-4">
            {activeProject || 'Untitled Project'}
          </h3>
          <select 
            className="text-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="vs-dark">Dark</option>
            <option value="vs-light">Light</option>
            <option value="hc-black">High Contrast</option>
          </select>
        </div>
        <div className="flex space-x-2">
          <button
            className="text-sm bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 rounded px-3 py-1"
            onClick={() => createFile('Untitled.js', '// Enter your code here\n\n')}
          >
            New File
          </button>
          <button
            className="text-sm bg-primary hover:bg-primary/90 text-white rounded px-3 py-1"
            onClick={executeCode}
            disabled={!currentFile || isProcessing}
          >
            Run
          </button>
        </div>
      </div>
      
      <ResizablePanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        {/* File Explorer Panel */}
        <ResizablePanel 
          defaultSize={leftPanelSize} 
          minSize={15} 
          maxSize={30}
          onResize={setLeftPanelSize}
          className="bg-neutral-50 dark:bg-neutral-950 border-r border-neutral-300 dark:border-neutral-700"
        >
          <ProjectExplorer 
            onFileSelect={selectFile}
            onCreateFile={createFile}
            onCreateFolder={createFolder}
            onRenameFile={renameFile}
            onDeleteFile={deleteFile}
            currentFilePath={currentFile?.path}
          />
        </ResizablePanel>
        
        <ResizableHandle withHandle className="bg-neutral-300 dark:bg-neutral-700" />
        
        {/* Editor and Terminal Panel */}
        <ResizablePanel defaultSize={100 - leftPanelSize} minSize={50}>
          <ResizablePanelGroup direction="vertical">
            {/* Editor Panel */}
            <ResizablePanel 
              defaultSize={100 - bottomPanelSize} 
              minSize={30} 
              className="overflow-hidden"
            >
              {currentFile ? (
                <Editor
                  height="100%"
                  language={getEditorLanguage()}
                  theme={theme}
                  value={fileContent}
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  options={{
                    fontSize: 14,
                    minimap: { enabled: true },
                    lineNumbers: 'on',
                    tabSize: 2,
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-neutral-600 dark:text-neutral-400">
                  <div className="text-6xl mb-4">📄</div>
                  <p>No file selected</p>
                  <button
                    className="mt-4 text-sm bg-primary hover:bg-primary/90 text-white rounded px-3 py-1"
                    onClick={() => createFile('index.js', '// Welcome to PodPlai Studio\n\nconsole.log("Hello, world!");\n')}
                  >
                    Create a new file
                  </button>
                </div>
              )}
            </ResizablePanel>
            
            <ResizableHandle withHandle className="bg-neutral-300 dark:bg-neutral-700" />
            
            {/* Terminal Panel */}
            <ResizablePanel 
              defaultSize={bottomPanelSize} 
              minSize={15} 
              maxSize={70}
              onResize={setBottomPanelSize}
              className="border-t border-neutral-300 dark:border-neutral-700 overflow-hidden"
            >
              <div className="h-full bg-black">
                <div className="bg-neutral-900 p-1 text-neutral-300 text-xs border-b border-neutral-700 flex items-center">
                  <span className="material-icons text-base mr-1">terminal</span>
                  <span>Terminal</span>
                  <button 
                    className="ml-auto text-neutral-400 hover:text-neutral-200 focus:outline-none"
                    onClick={async () => {
                      if (terminalSessionId) {
                        await apiRequest('/api/terminal/execute', 'POST', {
                          command: 'clear',
                          sessionId: terminalSessionId
                        });
                      }
                    }}
                  >
                    <span className="material-icons text-sm">refresh</span>
                  </button>
                </div>
                <div className="h-[calc(100%-28px)]">
                  {terminalSessionId ? (
                    <EnhancedTerminal 
                      sessionId={terminalSessionId} 
                      onError={(error, lineNumber) => {
                        // Highlight error line in editor if available
                        if (editorRef.current && lineNumber) {
                          const line = parseInt(lineNumber);
                          if (!isNaN(line)) {
                            editorRef.current.revealLineInCenter(line);
                            editorRef.current.setPosition({ lineNumber: line, column: 1 });
                            editorRef.current.focus();
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-neutral-500">
                      Initializing terminal...
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default ReplicodeView;
