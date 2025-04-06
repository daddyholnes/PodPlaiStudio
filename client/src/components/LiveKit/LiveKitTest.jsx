
import React, { useState } from 'react';
import { useRoom } from '@livekit/components-react';
import { createRoom, fetchRoomToken } from '../../services/liveKitService';

const LiveKitTest = () => {
  const [roomCreated, setRoomCreated] = useState(false);
  const [roomStatus, setRoomStatus] = useState('Not connected');
  const [error, setError] = useState(null);
  const [roomName, setRoomName] = useState(`test-room-${Date.now().toString(36)}`);
  const [userName, setUserName] = useState(`user-${Date.now().toString(36)}`);
  const [token, setToken] = useState(null);
  
  const room = useRoom();

  // Function to create a test room
  const handleCreateRoom = async () => {
    try {
      setError(null);
      setRoomStatus('Creating room...');
      
      const roomData = await createRoom({ roomName });
      
      if (roomData) {
        setRoomCreated(true);
        setRoomStatus(`Room "${roomName}" created successfully`);
        
        // After creating the room, get a token to join it
        const tokenData = await fetchRoomToken(roomName, userName);
        setToken(tokenData.token);
      }
    } catch (err) {
      console.error('Error creating room:', err);
      setError(err.message || 'Failed to create room');
      setRoomStatus('Error creating room');
    }
  };

  return (
    <div className="livekit-test">
      <h2>LiveKit Room Testing</h2>
      
      <div>
        <p>Status: {roomStatus}</p>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {room ? (
          <p style={{ color: 'green' }}>Connected to LiveKit room: {room.name}</p>
        ) : (
          <p>Not connected to a LiveKit room</p>
        )}
        
        <div>
          <label htmlFor="roomName">Room Name: </label>
          <input 
            type="text" 
            id="roomName" 
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            style={{ margin: '5px', padding: '5px' }}
          />
        </div>
        
        <div>
          <label htmlFor="userName">User Name: </label>
          <input 
            type="text" 
            id="userName" 
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            style={{ margin: '5px', padding: '5px' }}
          />
        </div>
        
        <button 
          onClick={handleCreateRoom}
          disabled={roomCreated}
          style={{
            padding: '8px 16px',
            backgroundColor: roomCreated ? '#ccc' : '#007bff',
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
            <p>Room name: {roomName}</p>
            <p>User name: {userName}</p>
            {token && <p style={{ color: 'green' }}>Token received ✓</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveKitTest;
