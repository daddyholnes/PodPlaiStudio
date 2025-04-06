import React, { useState } from 'react';
import { createRoom, fetchRoomToken } from '../../services/liveKitService';
import VideoChat from './VideoChat';
import LiveKitProvider from './LiveKitProvider';

const LiveKitTest = () => {
  const [roomName, setRoomName] = useState(`test-room-${Date.now().toString(36)}`);
  const [identity, setIdentity] = useState(`user-${Date.now().toString(36)}`);
  const [roomCreated, setRoomCreated] = useState(false);
  const [joinedRoom, setJoinedRoom] = useState(false);
  const [error, setError] = useState(null);

  // Function to create a room
  const handleCreateRoom = async () => {
    try {
      setError(null);
      const response = await createRoom({ roomName });
      if (response && response.success) {
        setRoomCreated(true);
        console.log('Room created successfully:', response);
      } else {
        throw new Error('Failed to create room');
      }
    } catch (err) {
      console.error('Error creating room:', err);
      setError(err.message || 'Error creating room');
    }
  };

  // Function to join a room
  const handleJoinRoom = () => {
    setJoinedRoom(true);
  };

  return (
    <div className="livekit-test" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {!joinedRoom ? (
        <div style={{ padding: '20px' }}>
          <h2>LiveKit Room Test</h2>

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

          {error && <p style={{ color: 'red' }}>Error: {error}</p>}

          <button 
            onClick={handleCreateRoom}
            disabled={roomCreated}
            style={{ marginRight: '10px', padding: '8px 16px' }}
          >
            {roomCreated ? 'Room Created' : 'Create Room'}
          </button>

          <button 
            onClick={handleJoinRoom}
            disabled={!roomCreated}
            style={{ padding: '8px 16px' }}
          >
            Join Room
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0 }}>
          <LiveKitProvider roomName={roomName} participantName={identity}>
            <VideoChat />
          </LiveKitProvider>
        </div>
      )}
    </div>
  );
};

export default LiveKitTest;