import React, { useState, useEffect } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  GridLayout,
  ParticipantTile,
  useTracks,
  RoomAudioRenderer,
  ControlBar
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import { fetchRoomToken } from '../../services/liveKitService';

const VideoChat = ({ roomName, username }) => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const getToken = async () => {
      try {
        if (roomName && username) {
          const fetchedToken = await fetchRoomToken(roomName, username);
          setToken(fetchedToken);
        }
      } catch (err) {
        setError('Failed to get room token. Please try again.');
        console.error('Error fetching token:', err);
      }
    };

    getToken();
  }, [roomName, username]);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!token) {
    return <div>Loading...</div>;
  }

  return (
    <div className="video-chat-container">
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={import.meta.env.VITE_LIVEKIT_SERVER_URL || 'ws://localhost:7880'}
        data-lk-theme="default"
        style={{ height: '100%', width: '100%' }}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
};

export default VideoChat;
