
import React, { useState } from 'react';
import { useLiveKit } from './LiveKitProvider';
import VideoChat from './VideoChat';
import './LiveKitTest.css';

const LiveKitTest = () => {
  const { createAndJoinRoom, loading, error, connected } = useLiveKit();
  const [roomName, setRoomName] = useState('');
  const [username, setUsername] = useState('');
  const [joinedRoom, setJoinedRoom] = useState(null);
  const [joinedAs, setJoinedAs] = useState(null);
  const [token, setToken] = useState(null);

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    
    if (!roomName || !username) {
      alert('Please enter both room name and username');
      return;
    }
    
    try {
      const result = await createAndJoinRoom(roomName, username);
      setToken(result.token);
      setJoinedRoom(result.room);
      setJoinedAs(result.participant);
    } catch (err) {
      console.error('Failed to join room:', err);
    }
  };

  return (
    <div className="livekit-test-container">
      <div className="livekit-panel">
        <h2>Join Video Chat</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        {!token ? (
          <form onSubmit={handleJoinRoom}>
            <div className="form-group">
              <label htmlFor="roomName">Room Name:</label>
              <input
                type="text"
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="username">Your Name:</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
            
            <button type="submit" disabled={loading} className="join-button">
              {loading ? 'Joining...' : 'Join Room'}
            </button>
          </form>
        ) : (
          <div className="room-info">
            <p>Connected to room: <strong>{joinedRoom}</strong></p>
            <p>Joined as: <strong>{joinedAs}</strong></p>
            <button onClick={() => setToken(null)} className="leave-button">
              Leave Room
            </button>
          </div>
        )}
      </div>
      
      {token && (
        <div className="video-container">
          <VideoChat token={token} roomName={joinedRoom} />
        </div>
      )}
    </div>
  );
};

export default LiveKitTest;
