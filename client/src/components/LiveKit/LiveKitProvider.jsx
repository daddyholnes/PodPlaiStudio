import React, { createContext, useContext, useState, useEffect } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';

// Default server URL from environment variable or fallback
const DEFAULT_SERVER_URL = import.meta.env.VITE_LIVEKIT_SERVER_URL || 'wss://dartopia-gvu1e64v.livekit.cloud';
const DEFAULT_ROOM = 'podplay-default-room';

// Context for LiveKit state
const LiveKitContext = createContext(null);

// Provider component to manage LiveKit connection
export function LiveKitProvider({ children }) {
  const [token, setToken] = useState('');
  const [roomName, setRoomName] = useState(DEFAULT_ROOM);
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('User-' + Math.floor(Math.random() * 10000));

  // Function to fetch token from server
  const fetchToken = async (room, username) => {
    setIsConnecting(true);
    setError(null);

    try {
      const response = await fetch(`/api/livekit/token?room=${room}&username=${username}`);

      if (!response.ok) {
        throw new Error(`Error fetching token: ${response.statusText}`);
      }

      const data = await response.json();
      setToken(data.token);
      return data.token;
    } catch (err) {
      console.error('Error fetching LiveKit token:', err);
      setError(err.message);
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  // Connect to room with current settings
  const connectToRoom = async (room = roomName, username = userName) => {
    setRoomName(room);
    setUserName(username);
    return await fetchToken(room, username);
  };

  // Update server URL
  const setServer = (url) => {
    setServerUrl(url);
  };

  // Create context value
  const contextValue = {
    token,
    roomName,
    serverUrl,
    userName,
    isConnecting,
    error,
    connectToRoom,
    setServer,
    setUserName
  };

  return (
    <LiveKitContext.Provider value={contextValue}>
      {token && serverUrl ? (
        <LiveKitRoom
          serverUrl={serverUrl}
          token={token}
          connectOptions={{ autoSubscribe: true }}
          data-lk-theme="default"
        >
          {children}
        </LiveKitRoom>
      ) : (
        children
      )}
    </LiveKitContext.Provider>
  );
}

// Hook to use LiveKit context
export function useLiveKit() {
  const context = useContext(LiveKitContext);

  if (!context) {
    throw new Error('useLiveKit must be used within a LiveKitProvider');
  }

  return context;
}