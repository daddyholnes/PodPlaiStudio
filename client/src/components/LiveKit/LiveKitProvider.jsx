import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

// Create context for LiveKit functionality
const LiveKitContext = createContext(null);

// Custom hook to access the LiveKit context
export const useLiveKit = () => useContext(LiveKitContext);

const LiveKitProvider = ({ children }) => {
  const [room, setRoom] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Function to create and join a room
  const createAndJoinRoom = async (roomName, participantName) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`Creating room: ${roomName}`);

      // First create the room on the server
      await axios.post('/api/livekit/create-room', { roomName });

      // Then get a token to join the room
      console.log(`Fetching token for room: ${roomName}, identity: ${participantName}`);
      const response = await axios.post('/api/livekit/token', { 
        roomName, 
        participantName 
      });

      const token = response.data.token;

      setConnected(true);
      setLoading(false);

      return {
        token,
        room: roomName,
        participant: participantName
      };
    } catch (err) {
      console.error('Error joining room:', err);
      setError(err.message || 'Failed to join room');
      setLoading(false);
      throw err;
    }
  };

  // Function to leave a room
  const leaveRoom = () => {
    if (room) {
      room.disconnect();
      setRoom(null);
      setConnected(false);
    }
  };

  // Context value
  const contextValue = {
    room,
    setRoom,
    connected,
    error,
    loading,
    createAndJoinRoom,
    leaveRoom
  };

  return (
    <LiveKitContext.Provider value={contextValue}>
      {children}
    </LiveKitContext.Provider>
  );
};

export default LiveKitProvider;