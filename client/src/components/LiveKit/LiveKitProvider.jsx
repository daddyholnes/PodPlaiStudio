
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Room } from 'livekit-client';
import { LiveKitRoom } from '@livekit/components-react';
import { fetchRoomToken } from '../../services/liveKitService';

// Create a context for LiveKit data
export const LiveKitContext = createContext(null);

export const useLiveKit = () => useContext(LiveKitContext);

const LiveKitProvider = ({ children, roomName = 'default-room' }) => {
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [room, setRoom] = useState(null);
  
  // Get server URL from environment variables
  const serverUrl = import.meta.env.VITE_LIVEKIT_SERVER_URL || 'ws://localhost:7880';
  
  useEffect(() => {
    async function initLiveKit() {
      setIsLoading(true);
      try {
        // Generate a default identity using timestamp
        const identity = `user-${Date.now().toString(36)}`;
        
        // Request token for this room and identity
        const tokenValue = await fetchRoomToken(roomName, identity);
        console.log('Token received for LiveKit room:', roomName);
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
  }, [roomName]);
  
  if (isLoading) {
    return <div className="livekit-loading">Connecting to LiveKit...</div>;
  }
  
  if (error || !token) {
    return (
      <div className="livekit-error">
        <p>LiveKit connection error: {error || 'No token available'}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }
  
  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      // Start with audio/video off
      audio={false}
      video={false}
      connectOptions={{
        autoSubscribe: true
      }}
      onConnected={(room) => {
        console.log('Connected to LiveKit room:', room.name);
        setRoom(room);
      }}
      onDisconnected={() => {
        console.log('Disconnected from LiveKit room');
        setRoom(null);
      }}
      onError={(err) => {
        console.error('LiveKit connection error:', err);
        setError(err.message);
      }}
    >
      <LiveKitContext.Provider value={{ room, isConnected: !!room }}>
        {children}
      </LiveKitContext.Provider>
    </LiveKitRoom>
  );
};

export default LiveKitProvider;
