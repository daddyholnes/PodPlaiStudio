
import React, { useEffect } from 'react';
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

const VideoChat = ({ token, roomName }) => {
  if (!token) {
    return <div className="loading-message">Waiting for connection token...</div>;
  }

  return (
    <div className="video-chat-container">
      <LiveKitRoom
        token={token}
        serverUrl={import.meta.env.VITE_LIVEKIT_URL || "wss://your-livekit-server.livekit.cloud"}
        connect={true}
        audio={true}
        video={true}
        className="video-room"
      >
        <RoomAudioRenderer />
        <VideoLayout />
        <ControlBar />
      </LiveKitRoom>
    </div>
  );
};

function VideoLayout() {
  // Get tracks published by participants
  const tracks = useTracks({
    sources: [Track.Source.Camera, Track.Source.ScreenShare],
    onlySubscribed: false,
  });

  return (
    <GridLayout tracks={tracks} className="video-grid">
      {tracks.map((track) => (
        <ParticipantTile
          key={track.participant.identity + track.source}
          participant={track.participant}
          source={track.source}
          className="video-tile"
        />
      ))}
    </GridLayout>
  );
}

export default VideoChat;
