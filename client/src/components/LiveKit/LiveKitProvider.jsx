
import React, { createContext, useContext, useState, useEffect } from 'react';
import { LiveKitRoom } from 'livekit-react';
import axios from 'axios';

// Create context for LiveKit functionality
const LiveKitContext = createContext(null);

export function LiveKitProvider({ children }) {
  const [roomName, setRoomName] = useState('');
  const [token, setToken] = useState('');
  const [identity, setIdentity] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  // Create a function to create and join a room
  const createAndJoinRoom = async (roomName, identity) => {
    try {
      setError(null);
      
      // First ensure the room exists
      console.log(`Creating room: ${roomName}`);
      await axios.post('/api/livekit/room', { name: roomName });
      
      // Then generate a token for the user
      console.log(`Fetching token for room: ${roomName}, identity: ${identity}`);
      const response = await axios.post('/api/livekit/token', {
        room: roomName,
        identity
      });
      
      if (!response.data?.token) {
        throw new Error('Failed to get token');
      }
      
      // Set state with the room and token information
      setRoomName(roomName);
      setToken(response.data.token);
      setIdentity(identity);
      setIsConnected(true);
      
      return {
        roomName,
        token: response.data.token,
        identity
      };
    } catch (err) {
      console.error('Error creating room:', err);
      setError(err.message || 'Failed to create or join room');
      throw err;
    }
  };

  // Leave the current room
  const leaveRoom = () => {
    setRoomName('');
    setToken('');
    setIsConnected(false);
  };

  // Context value
  const contextValue = {
    roomName,
    token,
    identity,
    isConnected,
    error,
    createAndJoinRoom,
    leaveRoom
  };

  return (
    <LiveKitContext.Provider value={contextValue}>
      {isConnected && token ? (
        <LiveKitRoom
          serverUrl={import.meta.env.VITE_LIVEKIT_URL || 'wss://your-livekit-server.com'}
          token={token}
          onConnected={() => console.log('Connected to LiveKit room:', roomName)}
          onDisconnected={() => console.log('Disconnected from LiveKit room')}
          connectOptions={{ autoSubscribe: true }}
          video={true}
          audio={true}
        >
          {children}
        </LiveKitRoom>
      ) : (
        children
      )}
    </LiveKitContext.Provider>
  );
}

// Create a custom hook to use the LiveKit context
export function useLiveKit() {
  const context = useContext(LiveKitContext);
  if (!context) {
    console.warn('useLiveKit must be used within a LiveKitProvider');
    return null;
  }
  return context;
}

export default LiveKitProvider;
