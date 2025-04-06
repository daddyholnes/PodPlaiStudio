
import React, { createContext, useContext, useState, useEffect } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';

const LiveKitContext = createContext();

export const useLiveKit = () => useContext(LiveKitContext);

export const LiveKitProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [identity, setIdentity] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const createRoom = async (name) => {
    try {
      console.log(`Creating room: ${name}`);
      const response = await fetch('/api/livekit/create-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create room');
      }
      
      setRoomName(name);
      return name;
    } catch (error) {
      console.error('Error creating room:', error);
      return null;
    }
  };

  const joinRoom = async (room, username) => {
    try {
      console.log(`Fetching token for room: ${room}, identity: ${username}`);
      const response = await fetch('/api/livekit/join-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ room, identity: username }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to join room');
      }
      
      const { token } = await response.json();
      setToken(token);
      setRoomName(room);
      setIdentity(username);
      return token;
    } catch (error) {
      console.error('Error joining room:', error);
      return null;
    }
  };

  const leaveRoom = () => {
    setToken(null);
    setRoomName('');
    setIdentity('');
    setIsConnected(false);
  };

  return (
    <LiveKitContext.Provider
      value={{
        token,
        roomName,
        identity,
        isConnected,
        setIsConnected,
        createRoom,
        joinRoom,
        leaveRoom,
      }}
    >
      {token ? (
        <LiveKitRoom
          serverUrl={import.meta.env.VITE_LIVEKIT_SERVER_URL || 'wss://demo.livekit.cloud'}
          token={token}
          connectOptions={{ autoSubscribe: true }}
          onConnected={() => {
            console.log('Connected to LiveKit room');
            setIsConnected(true);
          }}
          onDisconnected={() => {
            console.log('Disconnected from LiveKit room');
            setIsConnected(false);
          }}
          onError={(error) => {
            console.error('LiveKit connection error:', error);
          }}
          audio={true}
          video={true}
        >
          {children}
        </LiveKitRoom>
      ) : (
        children
      )}
    </LiveKitContext.Provider>
  );
};
