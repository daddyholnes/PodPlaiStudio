
import React, { useState, useEffect } from 'react';
import { RoomProvider } from '@livekit/components-react';
import { fetchRoomToken } from '../../services/liveKitService';

const LiveKitProvider = ({ children, token, serverUrl, room = 'default-room' }) => {
  const [roomToken, setRoomToken] = useState(token);
  const [loading, setLoading] = useState(!token);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getToken = async () => {
      if (token) return; // Skip if token is provided through props
      
      try {
        setLoading(true);
        const fetchedToken = await fetchRoomToken(room);
        setRoomToken(fetchedToken);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch LiveKit token:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    
    getToken();
  }, [token, room]);

  if (loading) {
    return <div className="livekit-loading">Loading LiveKit connection...</div>;
  }

  if (error || !roomToken) {
    return (
      <div className="livekit-error">
        <p>Failed to initialize LiveKit: {error?.message || 'No token available'}</p>
      </div>
    );
  }

  return (
    <RoomProvider
      serverUrl={serverUrl || import.meta.env.VITE_LIVEKIT_URL}
      token={roomToken}
      connectOptions={{
        autoSubscribe: true
      }}
    >
      {children}
    </RoomProvider>
  );
};

// Higher-order component to wrap components that need LiveKit context
export const withLiveKitProvider = (Component) => {
  return function WrappedComponent(props) {
    // Check if we have LiveKit configuration from props or environment
    const token = props.token || import.meta.env.VITE_LIVEKIT_TOKEN;
    const serverUrl = props.serverUrl || import.meta.env.VITE_LIVEKIT_URL;
    const roomName = props.room || 'default-room';
    
    return (
      <LiveKitProvider 
        token={token} 
        serverUrl={serverUrl}
        room={roomName}
      >
        <Component {...props} liveKitAvailable={true} />
      </LiveKitProvider>
    );
  };
};

export default LiveKitProvider;
