
import React, { useState, useEffect } from 'react';
import {
  VideoConference,
  GridLayout,
  ParticipantTile,
  useTracks,
  ControlBar,
  RoomAudioRenderer,
  useLocalParticipant,
  useRoomContext
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useLiveKit } from './LiveKitProvider';
import ScreenShare from './ScreenShare';
import './VideoChat.css';

export default function VideoChat() {
  const { token, roomName, serverUrl, userName, isConnecting, error, connectToRoom } = useLiveKit();
  const [isConnected, setIsConnected] = useState(false);
  const [roomInput, setRoomInput] = useState('podplay-default-room');
  const [nameInput, setNameInput] = useState('User-' + Math.floor(Math.random() * 10000));

  // Auto-connect on component mount
  useEffect(() => {
    if (!isConnected && !token) {
      connectToRoom(roomInput, nameInput);
    }
  }, []);

  // Handle connection state
  useEffect(() => {
    setIsConnected(!!token);
  }, [token]);

  // Handle connection button click
  const handleConnect = async () => {
    if (isConnected) {
      // Refresh the page to disconnect
      window.location.reload();
    } else {
      await connectToRoom(roomInput, nameInput);
    }
  };

  return (
    <div className="video-chat-container">
      {!isConnected ? (
        <div className="connect-container">
          <h2>Video Collaboration</h2>
          <div className="connect-form">
            <div className="input-group">
              <label>Room Name:</label>
              <input
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                disabled={isConnecting}
              />
            </div>
            <div className="input-group">
              <label>Your Name:</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                disabled={isConnecting}
              />
            </div>
            <button 
              className={`connect-button ${isConnecting ? 'connecting' : ''}`}
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect to Room'}
            </button>
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      ) : (
        <div className="video-conference-container">
          <div className="room-info">
            <span>Room: {roomName}</span>
            <span>User: {userName}</span>
            <button className="disconnect-button" onClick={handleConnect}>
              Disconnect
            </button>
          </div>
          
          <VideoConference>
            <RoomAudioRenderer />
            <GridLayout>
              <ParticipantTile />
            </GridLayout>
            <ControlBar />
          </VideoConference>
          
          <ScreenShare />
        </div>
      )}
    </div>
  );
}
