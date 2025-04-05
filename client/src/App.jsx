import React, { useState, useEffect } from 'react';
import VideoChat from './components/LiveKit/VideoChat';
import ScreenShare from './components/LiveKit/ScreenShare';
import MonacoEditor from './components/Editor/MonacoEditor';
import XtermTerminal from './components/Terminal/XtermTerminal';
import FileTree from './components/FileExplorer/FileTree';
import { getFileContent, updateFile } from './services/fileService';
import { createTerminalSession } from './services/terminalService';
import { configureWebSocketReconnection } from './services/webSocketService';
import './App.css';

const App = () => {
  const [roomName, setRoomName] = useState('');
  const [username, setUsername] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [terminalSessionId, setTerminalSessionId] = useState('');
  const [editorLanguage, setEditorLanguage] = useState('javascript');
  const [theme, setTheme] = useState('vs-dark');
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(300);
  
  // Initialize terminal session
  useEffect(() => {
    const initTerminal = async () => {
      try {
        const session = await createTerminalSession();
        setTerminalSessionId(session.sessionId);
      } catch (error) {
        console.error('Failed to create terminal session:', error);
      }
    };
    
    initTerminal();
    
    // Configure WebSocket reconnection
    configureWebSocketReconnection();
    
    return () => {
      // Cleanup if needed
    };
  }, []);
  
  // Load file content when selected
  useEffect(() => {
    if (currentFile) {
      loadFileContent(currentFile);
    }
  }, [currentFile]);
  
  const loadFileContent = async (filePath) => {
    try {
      const response = await getFileContent(filePath);
      setFileContent(response.content);
      
      // Set language based on file extension
      const extension = filePath.split('.').pop().toLowerCase();
      switch (extension) {
        case 'js':
          setEditorLanguage('javascript');
          break;
        case 'ts':
        case 'tsx':
          setEditorLanguage('typescript');
          break;
        case 'py':
          setEditorLanguage('python');
          break;
        case 'json':
          setEditorLanguage('json');
          break;
        case 'html':
          setEditorLanguage('html');
          break;
        case 'css':
          setEditorLanguage('css');
          break;
        case 'md':
          setEditorLanguage('markdown');
          break;
        default:
          setEditorLanguage('javascript');
      }
    } catch (error) {
      console.error('Failed to load file content:', error);
    }
  };
  
  const handleFileSelect = (filePath) => {
    setCurrentFile(filePath);
  };
  
  const handleCodeChange = (newValue) => {
    setFileContent(newValue);
  };
  
  const handleSaveFile = async () => {
    if (currentFile) {
      try {
        await updateFile(currentFile, fileContent);
        console.log('File saved successfully');
      } catch (error) {
        console.error('Failed to save file:', error);
      }
    }
  };
  
  const handleJoinRoom = () => {
    if (roomName && username) {
      setIsJoined(true);
    }
  };
  
  const handleToggleLeftPanel = () => {
    setIsLeftPanelOpen(!isLeftPanelOpen);
  };
  
  const handleToggleRightPanel = () => {
    setIsRightPanelOpen(!isRightPanelOpen);
  };
  
  return (
    <div className="app-container">
      {!isJoined ? (
        <div className="join-room-form" role="form" aria-label="Join video chat room">
          <h2>Join Video Chat Room</h2>
          <div className="form-group">
            <label htmlFor="room-name">Room Name:</label>
            <input
              id="room-name"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
              aria-required="true"
            />
          </div>
          <div className="form-group">
            <label htmlFor="username">Your Name:</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              aria-required="true"
            />
          </div>
          <button 
            onClick={handleJoinRoom} 
            disabled={!roomName || !username}
            aria-label="Join room"
          >
            Join Room
          </button>
        </div>
      ) : (
        <div className="workspace">
          <header className="app-header">
            <h1>PodPlai Studio</h1>
            <div className="header-controls">
              <button 
                onClick={handleToggleLeftPanel}
                className="panel-toggle"
                aria-label={isLeftPanelOpen ? "Hide file explorer" : "Show file explorer"}
                aria-pressed={isLeftPanelOpen}
              >
                {isLeftPanelOpen ? '◀' : '▶'} Files
              </button>
              <button 
                onClick={handleToggleRightPanel}
                className="panel-toggle"
                aria-label={isRightPanelOpen ? "Hide video chat" : "Show video chat"}
                aria-pressed={isRightPanelOpen}
              >
                Video {isRightPanelOpen ? '▶' : '◀'}
              </button>
              <button 
                onClick={handleSaveFile} 
                disabled={!currentFile}
                aria-label="Save current file"
              >
                Save
              </button>
              <select 
                value={theme} 
                onChange={(e) => setTheme(e.target.value)}
                aria-label="Editor theme"
              >
                <option value="vs-dark">Dark</option>
                <option value="vs-light">Light</option>
                <option value="hc-black">High Contrast</option>
              </select>
            </div>
          </header>
          
          <div className="main-content">
            {isLeftPanelOpen && (
              <div className="file-explorer-panel">
                <FileTree 
                  onFileSelect={handleFileSelect} 
                  currentFilePath={currentFile}
                />
              </div>
            )}
            
            <div className="editor-panel">
              <div className="editor-container">
                {currentFile ? (
                  <MonacoEditor
                    language={editorLanguage}
                    value={fileContent}
                    onChange={handleCodeChange}
                    theme={theme}
                    filename={currentFile}
                  />
                ) : (
                  <div className="no-file-selected">
                    <p>Select a file from the explorer to edit</p>
                  </div>
                )}
              </div>
              
              <div 
                className="terminal-panel"
                style={{ height: `${bottomPanelHeight}px` }}
              >
                <div className="panel-header">
                  <h3>Terminal</h3>
                  <div 
                    className="drag-handle"
                    aria-hidden="true"
                    onMouseDown={(e) => {
                      const startY = e.clientY;
                      const startHeight = bottomPanelHeight;
                      
                      const onMouseMove = (moveEvent) => {
                        const newHeight = startHeight - (moveEvent.clientY - startY);
                        if (newHeight > 100 && newHeight < 800) {
                          setBottomPanelHeight(newHeight);
                        }
                      };
                      
                      const onMouseUp = () => {
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                      };
                      
                      document.addEventListener('mousemove', onMouseMove);
                      document.addEventListener('mouseup', onMouseUp);
                    }}
                  ></div>
                </div>
                <XtermTerminal sessionId={terminalSessionId} />
              </div>
            </div>
            
            {isRightPanelOpen && (
              <div className="video-chat-panel">
                <VideoChat roomName={roomName} username={username} />
                <div className="screen-share-controls">
                  <ScreenShare />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
