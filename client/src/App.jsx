
import React, { useState, useEffect } from 'react';
import './App.css';
import { LiveKitProvider } from './components/LiveKit/LiveKitProvider';
import VideoChat from './components/LiveKit/VideoChat'; 
import '@livekit/components-styles';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [appError, setAppError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // Default to dashboard tab

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
        <h1>PodPlay Studio</h1>
        <nav className="app-nav" style={{ marginTop: '10px' }}>
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`nav-button ${activeTab === 'dashboard' ? 'active' : ''}`}
            style={{ 
              marginRight: '10px', 
              padding: '8px 16px', 
              backgroundColor: activeTab === 'dashboard' ? '#4285f4' : '#e9ecef',
              color: activeTab === 'dashboard' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('videoChat')} 
            className={`nav-button ${activeTab === 'videoChat' ? 'active' : ''}`}
            style={{ 
              marginRight: '10px', 
              padding: '8px 16px', 
              backgroundColor: activeTab === 'videoChat' ? '#4285f4' : '#e9ecef',
              color: activeTab === 'videoChat' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Video Chat
          </button>
          <button 
            onClick={() => setActiveTab('sandbox')} 
            className={`nav-button ${activeTab === 'sandbox' ? 'active' : ''}`}
            style={{ 
              marginRight: '10px', 
              padding: '8px 16px', 
              backgroundColor: activeTab === 'sandbox' ? '#4285f4' : '#e9ecef',
              color: activeTab === 'sandbox' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Sandbox
          </button>
          {/* Add more navigation buttons as needed */}
        </nav>
      </header>

      <main className="app-main" style={{ flex: 1, padding: '20px', overflow: 'hidden' }}>
        {/* Conditionally render content based on active tab */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-container">
            <h2>Welcome to PodPlay Studio</h2>
            <p>Select a feature from the navigation bar above to get started.</p>
          </div>
        )}
        
        {activeTab === 'videoChat' && (
          <LiveKitProvider>
            <VideoChat />
          </LiveKitProvider>
        )}
        
        {activeTab === 'sandbox' && (
          <div className="sandbox-container">
            <h2>Sandbox</h2>
            <p>This is your sandbox environment for development and testing.</p>
            {/* Add your sandbox content here */}
          </div>
        )}
        
        {/* Add more tab content as needed */}
      </main>
    </div>
  );
};

export default App;
