
import React, { useState, useEffect } from 'react';
import './App.css';
import LiveKitProvider from './components/LiveKit/LiveKitProvider';
import VideoChat from './components/LiveKit/VideoChat';
import ScreenShare from './components/LiveKit/ScreenShare';
import LiveKitTest from './components/LiveKit/LiveKitTest';

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
        <div className="livekit-test-container" style={{ margin: '20px 0' }}>
          <LiveKitTest />
        </div>
        
        {livekitReady && (
          <LiveKitProvider
            roomName={roomName}
            participantName={username}
          >
            <div className="video-section">
              <h2>LiveKit Video Chat Demo</h2>
              <VideoChat />
              <ScreenShare />
            </div>
          </LiveKitProvider>
        )}
      </main>
    </div>
  );
};

export default App;
