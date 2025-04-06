import { LiveKitRoom } from '@livekit/components-react';
import React from 'react';

const LiveKitProvider = ({ children }) => {
  // These would come from your server
  const token = "your-token"; // Will be provided by server
  const serverUrl = "wss://your-livekit-server"; // Your LiveKit server URL

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      audio={true}
      video={true}
    >
      {children}
    </LiveKitRoom>
  );
};

// Higher-order component to wrap components that need LiveKit context
export const withLiveKitProvider = (Component) => {
  return function WrappedComponent(props) {
    // Check if we have LiveKit configuration from props or environment
    const token = props.token || import.meta.env.VITE_LIVEKIT_TOKEN;
    const serverUrl = props.serverUrl || import.meta.env.VITE_LIVEKIT_URL;
    const roomName = props.room || 'default-room';
    
    if (!token || !serverUrl) {
      console.warn('LiveKit token or server URL not provided. Component will render without LiveKit context.');
      
      return (
        <div className="livekit-context-missing">
          <Component {...props} liveKitAvailable={false} />
        </div>
      );
    }
    
    return (
      <LiveKitProvider 
        token={token} 
        serverUrl={serverUrl}
        room={roomName}
        onError={(error) => console.error('LiveKit error:', error)}
      >
        <Component {...props} liveKitAvailable={true} />
      </LiveKitProvider>
    );
  };
};

export default LiveKitProvider;