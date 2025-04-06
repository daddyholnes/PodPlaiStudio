import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import { LiveKitRoom } from '@livekit/components-react';
import LiveKitProvider from './components/LiveKit/LiveKitProvider';
import VideoChat from './components/LiveKit/VideoChat';
import ScreenShare from './components/LiveKit/ScreenShare';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [appError, setAppError] = useState(null);
  const [livekitReady, setLivekitReady] = useState(false);
  const [roomName] = useState('default-room');
  const [username] = useState(`user-${Date.now().toString(36)}`);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        // Initialize app
        setLivekitReady(true);
      } catch (error) {
        console.error('App initialization error:', error);
        setAppError(error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  if (isLoading) {
    return <div className="loading">Loading application...</div>;
  }

  if (appError) {
    return <div className="error">Error: {appError.message}</div>;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>LiveKit Video Chat</h1>
      </header>

      <main className="app-content">
        {livekitReady ? (
          <LiveKitProvider
            roomName={roomName}
            participantName={username}
          >
            <div className="video-section">
              <VideoChat />
              <ScreenShare />
            </div>
          </LiveKitProvider>
        ) : (
          <div className="livekit-unavailable">
            <p>LiveKit functionality is currently unavailable.</p>
            <button onClick={() => setLivekitReady(true)}>Retry Connection</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;