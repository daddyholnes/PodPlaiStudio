
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
        // Simulate delay for loading resources
        setTimeout(() => {
          setLivekitReady(true);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('App initialization error:', error);
        setAppError(error);
        setIsLoading(false);
      }
    };

    init();
  }, []);

  if (isLoading) {
    return <div className="loading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading application...</div>;
  }

  if (appError) {
    return <div className="error" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'red' }}>Error: {appError.message}</div>;
  }

  return (
    <div className="app-container">
      <header className="app-header" style={{ padding: '20px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
        <h1>LiveKit Video Chat</h1>
      </header>

      <main className="app-content" style={{ padding: '20px' }}>
        <div className="livekit-test-container" style={{ margin: '20px 0', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <LiveKitTest />
        </div>
        
        {livekitReady && (
          <div className="livekit-demo-container" style={{ margin: '20px 0', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
            <LiveKitProvider
              roomName={roomName}
              participantName={username}
            >
              <div className="video-section">
                <h2>LiveKit Video Chat Demo</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '20px' }}>
                  <div style={{ flex: '1', minWidth: '300px' }}>
                    <VideoChat />
                  </div>
                  <div style={{ flex: '1', minWidth: '300px' }}>
                    <ScreenShare />
                  </div>
                </div>
              </div>
            </LiveKitProvider>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
