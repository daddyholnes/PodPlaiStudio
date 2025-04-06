
import React, { useState } from 'react';
import { createRoom } from '../../services/liveKitService';
import { useMediaDevices } from '@livekit/components-react';
import LiveKitProvider from './LiveKitProvider';

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
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">LiveKit Test</h2>
      
      {!isJoined ? (
        <div>
          <p>Status: {roomStatus}</p>
          {error && <p style={{ color: 'red' }}>Error: {error}</p>}
          
          <div className="mb-4">
            <label className="block mb-2">Room Name:</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="border p-2 w-full mb-2"
            />
            
            <label className="block mb-2">Participant Name:</label>
            <input
              type="text"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              className="border p-2 w-full"
            />
          </div>
          
          <button 
            onClick={handleCreateRoom}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
            disabled={roomCreated}
          >
            {roomCreated ? 'Room Created' : 'Create Room'}
          </button>
          
          <button
            onClick={handleJoinRoom}
            className="bg-green-500 text-white px-4 py-2 rounded"
            disabled={!roomName || !participantName}
          >
            Join Room
          </button>
          
          {roomCreated && (
            <div style={{ marginTop: '10px' }}>
              <p>Room is ready! You can now join it.</p>
              <p>Room name: {roomName}</p>
            </div>
          )}
        </div>
      ) : (
        <LiveKitProvider roomName={roomName} participantName={participantName}>
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-bold mb-2">Connected to LiveKit Room</h3>
            <p>Room: {roomName}</p>
            <p>Participant: {participantName}</p>
            <div className="mt-4">
              <button 
                onClick={() => setIsJoined(false)}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Leave Room
              </button>
            </div>
          </div>
        </LiveKitProvider>
      )}
    </div>
  );
};

export default LiveKitTest;
