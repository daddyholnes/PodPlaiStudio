import React, { useState, useEffect, createContext, useCallback } from 'react';
import { RoomProvider } from '@livekit/components-react';
import XtermTerminal from './components/Terminal/XtermTerminal';
import ScreenShare from './components/LiveKit/ScreenShare';
import { createTerminalSession } from './services/terminalService';
import './App.css';

// Create contexts for sharing state
export const TerminalContext = createContext(null);
export const LiveKitContext = createContext(null);

const App = () => {
  // Terminal state
  const [terminalSession, setTerminalSession] = useState(null);
  const [terminalError, setTerminalError] = useState(null);
  const [terminalLoading, setTerminalLoading] = useState(false);
  
  // LiveKit state
  const [liveKitRoom, setLiveKitRoom] = useState(null);
  const [liveKitToken, setLiveKitToken] = useState(null);
  const [liveKitError, setLiveKitError] = useState(null);
  const [liveKitLoading, setLiveKitLoading] = useState(false);

  // App state
  const [isLoading, setIsLoading] = useState(true);
  const [appError, setAppError] = useState(null);

  // Initialize terminal session
  const initTerminal = useCallback(async () => {
    if (terminalSession) return; // Already initialized

    setTerminalLoading(true);
    try {
      const session = await createTerminalSession();
      console.log('Terminal session created:', session);
      setTerminalSession(session);
      setTerminalError(null);
    } catch (error) {
      console.error('Failed to create terminal session:', error);
      setTerminalError(error);
      // Create a fallback session
      setTerminalSession({
        id: `fallback-${Date.now()}`,
        status: 'fallback'
      });
    } finally {
      setTerminalLoading(false);
    }
  }, [terminalSession]);

  // Initialize LiveKit room
  const initLiveKit = useCallback(async () => {
    if (liveKitRoom) return; // Already initialized

    setLiveKitLoading(true);
    try {
      // We'll use the createRoom and fetchRoomToken functions from liveKitService
      // instead of relying on a pre-existing token
      const roomName = 'default-room'; // or generate a unique room for this session
      const participantName = `user-${Date.now().toString(36)}`;
      
      // No need to set token here as LiveKitProvider will handle that
      setLiveKitError(null);
      console.log('LiveKit initialization prepared for room:', roomName);
    } catch (error) {
      console.error('Failed to initialize LiveKit:', error);
      setLiveKitError(error);
    } finally {
      setLiveKitLoading(false);
    }
  }, []);

  // Initialize app
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        await Promise.allSettled([
          initTerminal(),
          initLiveKit()
        ]);
      } catch (error) {
        console.error('App initialization error:', error);
        setAppError(error);
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
  }, [initTerminal, initLiveKit]);

  // Handle terminal session creation from child components
  const handleTerminalSessionCreate = useCallback((session) => {
    if (!session) return;
    setTerminalSession(session);
    console.log('Terminal session updated:', session);
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Initializing application...</p>
      </div>
    );
  }

  // Show error state
  if (appError) {
    return (
      <div className="app-error">
        <h1>Failed to initialize application</h1>
        <p>{appError.message}</p>
        <button onClick={() => window.location.reload()}>Reload Application</button>
      </div>
    );
  }

  // Render the application with proper context providers
  return (
    <div className="app-container">
      {/* Terminal Context Provider */}
      <TerminalContext.Provider value={{ 
        session: terminalSession, 
        setSession: handleTerminalSessionCreate,
        error: terminalError,
        isLoading: terminalLoading
      }}>
        {/* LiveKit Context Provider */}
        <LiveKitContext.Provider value={{
          token: liveKitToken,
          room: liveKitRoom,
          setRoom: setLiveKitRoom,
          error: liveKitError,
          isLoading: liveKitLoading
        }}>
          {/* LiveKit Room Provider (if token is available) */}
          {liveKitToken ? (
            <RoomProvider
              serverUrl={import.meta.env.VITE_LIVEKIT_SERVER_URL || "ws://localhost:7880"}
              token={liveKitToken}
              options={{
                adaptiveStream: true,
                dynacast: true
              }}
            >
              <div className="main-content">
                {/* Application Components */}
                <div className="screen-share-container">
                  <ScreenShare />
                </div>
                
                <div className="terminal-container">
                  <XtermTerminal 
                    sessionId={terminalSession?.id} 
                    onSessionCreate={handleTerminalSessionCreate} 
                  />
                </div>
              </div>
            </RoomProvider>
          ) : (
            <div className="livekit-unavailable">
              <p>LiveKit functionality is currently unavailable.</p>
              <p>{liveKitError?.message || "Token not provided"}</p>
              <button onClick={initLiveKit}>Retry Connection</button>
            </div>
          )}
        </LiveKitContext.Provider>
      </TerminalContext.Provider>
    </div>
  );
};

export default App;
