
import React, { useState } from 'react';
import { createRoom, fetchRoomToken } from '../../services/liveKitService';

const LiveKitTest = () => {
  const [roomCreated, setRoomCreated] = useState(false);
  const [roomStatus, setRoomStatus] = useState('Not connected');
  const [error, setError] = useState(null);
  const [roomName, setRoomName] = useState(`test-room-${Date.now().toString(36)}`);
  const [identity, setIdentity] = useState(`user-${Date.now().toString(36)}`);
  const [roomToken, setRoomToken] = useState(null);

  // Function to create a test room
  const handleCreateRoom = async () => {
    try {
      setError(null);
      setRoomStatus('Creating room...');
      
      const roomData = await createRoom({ roomName });
      
      if (roomData) {
        setRoomCreated(true);
        setRoomStatus('Room created successfully');
        console.log('Room created:', roomData);
      }
    } catch (err) {
      console.error('Error creating room:', err);
      setError(err.message || 'Failed to create room');
      setRoomStatus('Error creating room');
    }
  };

  // Function to get a token for the room
  const handleGetToken = async () => {
    try {
      setError(null);
      setRoomStatus('Getting room token...');
      
      const tokenData = await fetchRoomToken(roomName, identity);
      
      if (tokenData && tokenData.token) {
        setRoomToken(tokenData.token);
        setRoomStatus('Token obtained successfully');
        console.log('Token received:', tokenData.token);
      }
    } catch (err) {
      console.error('Error getting token:', err);
      setError(err.message || 'Failed to get token');
      setRoomStatus('Error getting token');
    }
  };

  return (
    <div className="livekit-test">
      <h2>LiveKit Room Test</h2>
      <div>
        <p>Status: {roomStatus}</p>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="roomName">Room Name: </label>
          <input 
            type="text" 
            id="roomName" 
            value={roomName} 
            onChange={(e) => setRoomName(e.target.value)}
            style={{ marginLeft: '5px', padding: '5px' }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="identity">Identity: </label>
          <input 
            type="text" 
            id="identity" 
            value={identity} 
            onChange={(e) => setIdentity(e.target.value)}
            style={{ marginLeft: '5px', padding: '5px' }}
          />
        </div>
        
        <button 
          onClick={handleCreateRoom}
          disabled={roomCreated}
          style={{
            marginRight: '10px',
            padding: '8px 16px',
            backgroundColor: roomCreated ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: roomCreated ? 'default' : 'pointer'
          }}
        >
          {roomCreated ? 'Room Created' : 'Create Room'}
        </button>
        
        <button 
          onClick={handleGetToken}
          disabled={!roomCreated || roomToken !== null}
          style={{
            padding: '8px 16px',
            backgroundColor: !roomCreated || roomToken !== null ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !roomCreated || roomToken !== null ? 'default' : 'pointer'
          }}
        >
          Get Token
        </button>
        
        {roomCreated && (
          <div style={{ marginTop: '10px' }}>
            <p>Room is ready! Room name: {roomName}</p>
          </div>
        )}
        
        {roomToken && (
          <div style={{ marginTop: '10px' }}>
            <p>Token obtained successfully!</p>
            <p>Token: <span style={{ fontSize: '12px', wordBreak: 'break-all' }}>{roomToken.substring(0, 20)}...{roomToken.substring(roomToken.length - 20)}</span></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveKitTest;
