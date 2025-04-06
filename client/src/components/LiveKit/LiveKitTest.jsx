
import React, { useState } from 'react';
import { useLiveKit } from './LiveKitProvider';
import VideoChat from './VideoChat';
import './LiveKitTest.css';

const LiveKitTest = () => {
  const { isConnected, createAndJoinRoom, leaveRoom, error } = useLiveKit();
  const [roomInput, setRoomInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomInput || !nameInput) return;
    
    setIsJoining(true);
    try {
      await createAndJoinRoom(roomInput, nameInput);
    } catch (err) {
      console.error('Error creating room:', err);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom();
  };

  return (
    <div className="livekit-test-container">
      <h1>LiveKit Test</h1>
      
      {!isConnected ? (
        <div className="join-form-container">
          <form onSubmit={handleCreateRoom} className="join-form">
            <div className="form-group">
              <label htmlFor="room-name">Room Name:</label>
              <input
                id="room-name"
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                placeholder="Enter room name"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="user-name">Your Name:</label>
              <input
                id="user-name"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="join-button"
              disabled={isJoining || !roomInput || !nameInput}
            >
              {isJoining ? 'Connecting...' : 'Join Room'}
            </button>
            
            {error && <p className="error-message">{error}</p>}
          </form>
        </div>
      ) : (
        <div className="video-container">
          <VideoChat />
          <button onClick={handleLeaveRoom} className="leave-button">
            Leave Room
          </button>
        </div>
      )}
    </div>
  );
};

export default LiveKitTest;
