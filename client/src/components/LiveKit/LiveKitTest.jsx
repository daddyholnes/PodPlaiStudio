
import React, { useState, useEffect } from 'react';
import { useRoom, useParticipant } from '@livekit/components-react';
import { createRoom } from '../../services/liveKitService';

const LiveKitTest = () => {
  const [roomCreated, setRoomCreated] = useState(false);
  const [roomStatus, setRoomStatus] = useState('Not connected');
  const room = useRoom();

  // Effect to check if room is connected
  useEffect(() => {
    if (room) {
      setRoomStatus(`Connected to room: ${room.name}`);
    } else {
      setRoomStatus('Room not connected');
    }
  }, [room]);

  // Function to create a test room
  const handleCreateRoom = async () => {
    try {
      setRoomStatus('Creating room...');
      const roomData = await createRoom({ roomName: `test-room-${Date.now()}` });
      setRoomCreated(true);
      setRoomStatus(`Room created: ${roomData.name}`);
    } catch (error) {
      setRoomStatus(`Error creating room: ${error.message}`);
    }
  };

  return (
    <div className="livekit-test" style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>LiveKit Test</h2>
      <div>
        <p>Status: {roomStatus}</p>
        {!roomCreated && (
          <button 
            onClick={handleCreateRoom}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#4CAF50', 
              color: 'white', 
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Create Test Room
          </button>
        )}
      </div>
    </div>
  );
};

export default LiveKitTest;
