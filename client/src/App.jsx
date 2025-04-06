import React, { useState, useEffect } from 'react';
import './App.css';
import LiveKitProvider from './components/LiveKit/LiveKitProvider'; // Added import for LiveKitProvider
import LiveKitTest from './components/LiveKit/LiveKitTest'; // Added import for LiveKitTest
import '@livekit/components-styles';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [appError, setAppError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize app
        setTimeout(() => {
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
    <div className="app-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="app-header" style={{ padding: '20px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
        <h1>LiveKit Video Chat</h1>
      </header>

      <main className="app-main" style={{ flex: 1, padding: '20px', overflow: 'hidden' }}>
        <LiveKitProvider> {/* Wrapped LiveKitTest with LiveKitProvider */}
          <LiveKitTest />
        </LiveKitProvider>
      </main>
    </div>
  );
};

export default App;