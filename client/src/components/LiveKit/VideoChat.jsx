
import React from 'react';
import {
  GridLayout,
  ParticipantTile,
  useTracks,
  useConnectionState,
  ConnectionState
} from '@livekit/components-react';
import { Track } from 'livekit-client';

const VideoChat = () => {
  // Get all camera and microphone tracks
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.Microphone, withPlaceholder: false },
  ]);

  const connectionState = useConnectionState();

  return (
    <div className="video-chat-container" style={{ width: '100%', height: '400px' }}>
      {connectionState === ConnectionState.Connected ? (
        tracks.length > 0 ? (
          <GridLayout tracks={tracks} style={{ height: '100%' }}>
            {tracks.map((track) => (
              <ParticipantTile key={track.sid} track={track} />
            ))}
          </GridLayout>
        ) : (
          <div className="no-participants">No participants with camera/microphone</div>
        )
      ) : (
        <div className="connecting">
          Connection status: {connectionState}...
        </div>
      )}
    </div>
  );
};

export default VideoChat;
