
import React, { createContext, useState, useContext } from 'react';
import { createRoom } from '../../services/liveKitService';

const LiveKitContext = createContext(null);

export const useLiveKit = () => useContext(LiveKitContext);

const LiveKitProvider = ({ children }) => {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const createAndJoinRoom = async (roomName) => {
    try {
      setIsConnecting(true);
      setError(null);
      
      // Generate a unique room name if not provided
      const finalRoomName = roomName || `room-${Date.now()}`;
      
      // Create the room on the server
      const roomData = await createRoom({ roomName: finalRoomName });
      
      // Set the current room info
      setCurrentRoom({
        name: roomData.name,
        createdAt: new Date(roomData.creationTime)
      });
      
      return finalRoomName;
    } catch (err) {
      console.error("Error creating room:", err);
      setError(err.message || "Failed to create room");
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  const leaveRoom = () => {
    setCurrentRoom(null);
  };

  const value = {
    currentRoom,
    isConnecting,
    error,
    createAndJoinRoom,
    leaveRoom
  };

  return (
    <LiveKitContext.Provider value={value}>
      {children}
    </LiveKitContext.Provider>
  );
};

export default LiveKitProvider;
