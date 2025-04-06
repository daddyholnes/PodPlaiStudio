
import React from 'react';
import {
  GridLayout,
  ParticipantTile,
  useTracks,
  RoomAudioRenderer,
  ControlBar
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';

const VideoChat = () => {
  // Get all camera and microphone tracks
  const tracks = useTracks([
    { source: Track.Source.Camera },
    { source: Track.Source.Microphone }
  ]);

  return (
    <div className="video-chat-container">
      {/* Render all remote participants */}
      <GridLayout tracks={tracks} style={{ height: '70vh' }}>
        <ParticipantTile />
      </GridLayout>

      {/* Audio renderer for the room */}
      <RoomAudioRenderer />

      {/* Video/audio controls */}
      <ControlBar />
    </div>
  );
};

export default VideoChat;
