
import React, { useEffect } from 'react';
import {
  useLocalParticipant,
  useParticipants,
  useTracks,
  useRoom,
  GridLayout,
  ParticipantTile,
  ControlBar,
  useCameraToggle,
  useMicrophoneToggle,
  useScreenShareToggle
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import './VideoChat.css';
import { useLiveKit } from './LiveKitProvider';

const VideoChat = ({ token, roomName }) => {
  const { room } = useRoom();
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const { isCameraEnabled, toggle: toggleCamera } = useCameraToggle();
  const { isMicrophoneEnabled, toggle: toggleMicrophone } = useMicrophoneToggle();
  const { isScreenShareEnabled, toggle: toggleScreenShare } = useScreenShareToggle();
  
  const tracks = useTracks([
    Track.Source.Camera,
    Track.Source.Microphone,
    Track.Source.ScreenShare,
  ]);

  useEffect(() => {
    // For debugging
    if (room) {
      console.log('Room connected:', room.name);
      console.log('Local participant:', localParticipant?.identity);
      console.log('Participants:', participants.map(p => p.identity));
      console.log('Tracks:', tracks);
    }
  }, [room, localParticipant, participants, tracks]);

  if (!room) {
    return (
      <div className="video-container">
        <div className="video-status">
          {roomName ? `Connecting to ${roomName}...` : 'Not connected to any room'}
        </div>
      </div>
    );
  }

  return (
    <div className="video-container">
      <div className="video-header">
        <h2>Room: {roomName}</h2>
        <div className="video-participant-count">
          {participants.length + 1} participant{participants.length !== 0 ? 's' : ''}
        </div>
      </div>
      
      <div className="video-grid">
        {tracks && tracks.length > 0 ? (
          <GridLayout>
            {tracks.map((track) => (
              <ParticipantTile
                key={track.participant.identity + track.source}
                participant={track.participant}
                source={track.source}
                className="video-tile"
              />
            ))}
          </GridLayout>
        ) : (
          <div className="no-tracks-message">
            No video tracks available. Enable your camera or wait for participants to join.
          </div>
        )}
      </div>
      
      <div className="video-controls">
        <ControlBar
          controls={{
            camera: true,
            microphone: true,
            screenShare: true,
            leave: true,
          }}
        />
      </div>
    </div>
  );
};

export default VideoChat;
