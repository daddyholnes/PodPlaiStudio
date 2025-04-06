
import React, { useState, useEffect } from 'react';
import { createRoom } from '../../services/liveKitService';

const LiveKitTest = () => {
  const [roomCreated, setRoomCreated] = useState(false);
  const [roomStatus, setRoomStatus] = useState('Not connected');
  const [error, setError] = useState(null);

  // Function to create a test room
  const handleCreateRoom = async () => {
    try {
      setRoomStatus('Creating room...');
      const roomName = `test-room-${Date.now()}`;
      const roomData = await createRoom({ roomName });
      
      if (roomData) {
        setRoomCreated(true);
        setRoomStatus(`Room created: ${roomData.name}`);
        console.log('Room created successfully:', roomData);
      } else {
        throw new Error('Failed to create room - no data returned');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      setError(error.message);
      setRoomStatus(`Error creating room: ${error.message}`);
    }
  };

  return (
    <div className="livekit-test" style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', margin: '10px 0' }}>
      <h2>LiveKit Test</h2>
      <div>
        <p>Status: {roomStatus}</p>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        
        <button 
          onClick={handleCreateRoom}
          disabled={roomCreated}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: roomCreated ? '#cccccc' : '#4CAF50', 
            color: 'white', 
            border: 'none',
            borderRadius: '4px',
            cursor: roomCreated ? 'default' : 'pointer',
            marginTop: '10px'
          }}
        >
          {roomCreated ? 'Room Created' : 'Create Test Room'}
        </button>
        
        {roomCreated && (
          <div style={{ marginTop: '10px' }}>
            <p>Room is ready! You can now connect to it.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveKitTest;
