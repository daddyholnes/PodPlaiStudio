import React, { createContext, useContext, useState, useEffect } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';

// Create context
const LiveKitContext = createContext();

export const useLiveKit = () => useContext(LiveKitContext);

export const LiveKitProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [connectionState, setConnectionState] = useState('disconnected');

  const serverUrl = import.meta.env.VITE_LIVEKIT_SERVER_URL || 'wss://dartopia-gvu1e64v.livekit.cloud';

  useEffect(() => {
    console.log("LiveKit Provider - Current state:", { 
      token: token ? "Token exists" : "No token",
      roomName, 
      userName, 
      isConnected,
      serverUrl,
      connectionState
    });
  }, [token, roomName, userName, isConnected, connectionState]);

  // Function to join a room
  const joinRoom = async (room, identity) => {
    try {
      console.log(`Attempting to join room: ${room} as ${identity}`);
      setError(null);
      setRoomName(room);
      setUserName(identity);
      setConnectionState('connecting');

      const response = await fetch('/api/livekit/join-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ room, identity }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join room');
      }

      const data = await response.json();
      console.log('Successfully received token');
      setToken(data.token);
      setConnectionState('token_received');
      return data.token;
    } catch (err) {
      setError(err.message);
      setConnectionState('error');
      console.error('Error joining room:', err);
      return null;
    }
  };

  // Function to leave a room
  const leaveRoom = () => {
    console.log('Leaving room');
    setToken(null);
    setRoomName('');
    setUserName('');
    setIsConnected(false);
    setConnectionState('disconnected');
  };

  const handleConnected = () => {
    console.log('LiveKit connected successfully!');
    setIsConnected(true);
    setConnectionState('connected');
  };

  const handleDisconnected = () => {
    console.log('LiveKit disconnected');
    setIsConnected(false);
    setConnectionState('disconnected');
  };

  const handleError = (err) => {
    console.error('LiveKit connection error:', err);
    setError(err?.message || 'Unknown connection error');
    setConnectionState('error');
  };

  const contextValue = {
    token,
    roomName,
    userName,
    isConnected,
    error,
    connectionState,
    joinRoom,
    leaveRoom,
    serverUrl
  };

  return (
    <LiveKitContext.Provider value={contextValue}>
      {token ? (
        <LiveKitRoom
          serverUrl={serverUrl}
          token={token}
          onDisconnected={handleDisconnected}
          onConnected={handleConnected}
          onError={handleError}
          data-lk-theme="default"
          video={true}
          audio={true}
          connectOptions={{
            autoSubscribe: true
          }}
        >
          {children}
        </LiveKitRoom>
      ) : (
        children
      )}
    </LiveKitContext.Provider>
  );
};