
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
  const [localError, setLocalError] = useState(null);

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    
    if (!roomName || !username) {
      setLocalError('Please enter both room name and username');
      return;
    }
    
    try {
      setLocalError(null);
      const result = await createAndJoinRoom(roomName, username);
      if (result && result.token) {
        setToken(result.token);
        setJoinedRoom(result.room);
        setJoinedAs(result.participant);
      } else {
        setLocalError('Failed to get a valid token');
      }
    } catch (err) {
      console.error('Failed to join room:', err);
      setLocalError(err.message || 'Failed to join room');
    }
  };

  const handleLeaveRoom = () => {
    setToken(null);
    setJoinedRoom(null);
    setJoinedAs(null);
    setLocalError(null);
  };

  const resetError = () => {
    setLocalError(null);
  };

  // Determine if there's an error to display
  const displayError = error || localError;

  return (
    <div className="livekit-test-container">
      <h1>LiveKit Video Chat Test</h1>
      
      {!token ? (
        <div className="join-form-container">
          <div className="join-form">
            <h2>Join a Video Room</h2>
            {displayError && (
              <div className="error-message">
                {displayError}
                <button onClick={resetError} className="close-error">×</button>
              </div>
            )}
            
            <form onSubmit={handleJoinRoom}>
              <div className="form-group">
                <label htmlFor="roomName">Room Name:</label>
                <input
                  type="text"
                  id="roomName"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter a room name"
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
              
              <button 
                type="submit" 
                className="join-button"
                disabled={loading}
              >
                {loading ? 'Connecting...' : 'Join Room'}
              </button>
            </form>
            
            <div className="server-info">
              <p>Using LiveKit server: {import.meta.env.VITE_LIVEKIT_URL || "Default Demo Server"}</p>
            </div>
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
