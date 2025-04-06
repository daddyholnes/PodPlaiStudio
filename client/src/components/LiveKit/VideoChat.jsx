
import React, { useState, useEffect } from 'react';
import { 
  LiveKitRoom, 
  GridLayout, 
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import './VideoChat.css';

// This is a free demo server from LiveKit for testing
// In production, you should use your own LiveKit server
const DEMO_LIVEKIT_URL = "wss://demo.livekit.cloud";

const VideoChat = ({ token, roomName }) => {
  const [connectionError, setConnectionError] = useState(null);
  const serverUrl = import.meta.env.VITE_LIVEKIT_URL || DEMO_LIVEKIT_URL;

  if (!token) {
    return <div className="loading-message">Waiting for connection token...</div>;
  }

  return (
    <div className="video-chat-container">
      {connectionError ? (
        <div className="connection-error">
          <h3>Connection Error</h3>
          <p>{connectionError}</p>
          <p>Make sure your LiveKit server is running and properly configured.</p>
          <p>Current LiveKit URL: {serverUrl}</p>
        </div>
      ) : (
        <LiveKitRoom
          token={token}
          serverUrl={serverUrl}
          connect={true}
          audio={true}
          video={true}
          className="video-room"
          onError={(error) => {
            console.error('LiveKit connection error:', error);
            setConnectionError(error.message || 'Failed to connect to LiveKit server');
          }}
        >
          <RoomAudioRenderer />
          <VideoLayout />
          <ControlBar />
        </LiveKitRoom>
      )}
    </div>
  );
};

function VideoLayout() {
  // Get tracks published by participants
  const tracks = useTracks({
    sources: [Track.Source.Camera, Track.Source.ScreenShare],
    onlySubscribed: false,
  });

  if (!tracks || tracks.length === 0) {
    return (
      <div className="empty-room-message">
        No video streams available. Make sure your camera is enabled.
      </div>
    );
  }

  return (
    <div className="video-grid">
      <GridLayout>
        {Array.isArray(tracks) && tracks.map((track) => (
          <ParticipantTile
            key={track.participant.identity + track.source}
            participant={track.participant}
            source={track.source}
            className="video-tile"
          />
        ))}
      </GridLayout>
    </div>
  );
}

export default VideoChat;
