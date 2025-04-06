
import React, { useState, useEffect } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import { fetchRoomToken, createRoom } from '../../services/liveKitService';

const LiveKitProvider = ({ children, roomName = 'default-room', participantName }) => {
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const serverUrl = import.meta.env.VITE_LIVEKIT_SERVER_URL || 'ws://localhost:7880';
  
  useEffect(() => {
    async function initLiveKit() {
      setIsLoading(true);
      try {
        // Generate identity if not provided
        const identity = participantName || `user-${Date.now().toString(36)}`;
        
        // Ensure the room exists
        await createRoom({ roomName });
        console.log('Room created or confirmed:', roomName);
        
        // Get token for this room and participant
        const tokenValue = await fetchRoomToken(roomName, identity);
        console.log('Token received for room:', roomName);
        
        setToken(tokenValue);
        setError(null);
      } catch (err) {
        console.error('LiveKit initialization error:', err);
        setError(err.message || 'Failed to initialize LiveKit');
      } finally {
        setIsLoading(false);
      }
    }
    
    initLiveKit();
  }, [roomName, participantName]);
  
  if (isLoading) {
    return <div className="livekit-loading">Loading LiveKit connection...</div>;
  }
  
  if (error || !token) {
    return (
      <div className="livekit-error">
        <p>Error connecting to LiveKit: {error || 'No token available'}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }
  
  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      audio={false}
      video={false}
      connectOptions={{
        autoSubscribe: true
      }}
      onConnected={() => console.log('Connected to LiveKit room:', roomName)}
      onError={(err) => console.error('LiveKit connection error:', err)}
    >
      {children}
    </LiveKitRoom>
  );
};

// Higher-order component to wrap components that need LiveKit context
export const withLiveKitProvider = (Component) => {
  return function WrappedComponent(props) {
    const { roomName = 'default-room', participantName, ...restProps } = props;
    
    return (
      <LiveKitProvider 
        roomName={roomName}
        participantName={participantName}
      >
        <Component {...restProps} liveKitAvailable={true} />
      </LiveKitProvider>
    );
  };
};

export default LiveKitProvider;
