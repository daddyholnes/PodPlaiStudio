
import React from 'react';
import {
  GridLayout,
  ParticipantTile,
  useTracks,
  ControlBar,
  useRoom
} from '@livekit/components-react';
import { Track } from 'livekit-client';

const VideoChat = () => {
  // Get all camera and microphone tracks
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.Microphone }
  ]);
  
  const room = useRoom();

  return (
    <div style={{ 
      height: '100%', 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column'
    }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <GridLayout tracks={tracks} style={{ height: '100%' }}>
          <ParticipantTile />
        </GridLayout>
      </div>
      
      <ControlBar controls={{ 
        microphone: true, 
        camera: true, 
        screenShare: true, 
        leave: true 
      }} />
      
      {room && (
        <div style={{ padding: '10px', backgroundColor: '#f0f0f0' }}>
          <p>Connected to room: {room.name}</p>
          <p>Participants: {room.participants.size + 1}</p>
        </div>
      )}
    </div>
  );
};

export default VideoChat;
