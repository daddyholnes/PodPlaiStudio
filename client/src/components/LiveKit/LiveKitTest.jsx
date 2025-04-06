
import React, { useState } from 'react';
import { createRoom } from '../../services/liveKitService';
import VideoChat from './VideoChat';

const LiveKitTest = () => {
  const [roomCreated, setRoomCreated] = useState(false);
  const [roomStatus, setRoomStatus] = useState('Not connected');
  const [error, setError] = useState(null);
  const [roomName, setRoomName] = useState(`test-room-${Date.now()}`);
  const [participantName, setParticipantName] = useState(`user-${Math.random().toString(36).substring(2, 11)}`);
  const [isJoined, setIsJoined] = useState(false);

  // Function to create a test room
  const handleCreateRoom = async () => {
    try {
      setError(null);
      setRoomStatus('Creating room...');
      
      const roomData = await createRoom({ roomName });
      
      if (roomData && roomData.success) {
        setRoomCreated(true);
        setRoomStatus('Room created successfully!');
      } else {
        throw new Error('Failed to create room');
      }
    } catch (err) {
      console.error('Error creating room:', err);
      setError(err.message || 'Failed to create room');
      setRoomStatus('Error creating room');
    }
  };

  const handleJoinRoom = () => {
    setIsJoined(true);
  };

  return (
    <div className="p-4 border rounded shadow-sm">
      <h2 className="text-xl font-bold mb-4">LiveKit Test</h2>
      
      {!isJoined ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block">Room Name:</label>
            <input 
              type="text" 
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block">Your Name:</label>
            <input 
              type="text" 
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          
          {!roomCreated ? (
            <button 
              onClick={handleCreateRoom}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Create Room
            </button>
          ) : (
            <button 
              onClick={handleJoinRoom}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Join Room
            </button>
          )}
          
          <div className="mt-2">
            <p>Status: {roomStatus}</p>
            {error && <p className="text-red-500">Error: {error}</p>}
          </div>
        </div>
      ) : (
        <div>
          <VideoChat roomName={roomName} participantName={participantName} />
          <button 
            onClick={() => setIsJoined(false)}
            className="bg-red-500 text-white px-4 py-2 rounded mt-4"
          >
            Leave Room
          </button>
        </div>
      )}
    </div>
  );
};

export default LiveKitTest;
