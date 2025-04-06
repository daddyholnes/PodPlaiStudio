
import React, { useState } from 'react';
import { useLiveKit } from './LiveKitProvider';
import VideoChat from './VideoChat';
import './LiveKitTest.css';

const LiveKitTest = () => {
  const { createAndJoinRoom, loading, error } = useLiveKit();
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

  const handleLeaveRoom = () => {
    setToken(null);
    setJoinedRoom(null);
    setJoinedAs(null);
  };

  return (
    <div className="livekit-test-container">
      <h1>LiveKit Video Chat Test</h1>
      
      {!token ? (
        <div className="join-form-container">
          <div className="join-form">
            <h2>Join a Video Room</h2>
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleJoinRoom}>
              <div className="form-group">
                <label htmlFor="roomName">Room Name:</label>
                <input
                  type="text"
                  id="roomName"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
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
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="join-button"
                disabled={loading}
              >
                {loading ? 'Connecting...' : 'Join Room'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="video-session">
          <div className="session-info">
            <h2>Connected to: {joinedRoom}</h2>
            <p>Joined as: {joinedAs}</p>
            <button onClick={handleLeaveRoom} className="leave-button">
              Leave Room
            </button>
          </div>
          
          <VideoChat 
            token={token} 
            roomName={joinedRoom} 
          />
        </div>
      )}
    </div>
  );
};

export default LiveKitTest;
