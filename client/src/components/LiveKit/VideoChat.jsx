
import React, { useState, useEffect } from 'react';
import {
  useLocalParticipant,
  useParticipants,
  useRoom,
  VideoTrack,
  AudioTrack,
  ControlBar,
  useTracks,
  Track
} from 'livekit-react';
import { Room, RoomEvent } from 'livekit-client';
import './VideoChat.css';

const VideoChat = () => {
  const room = useRoom();
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  
  // Get all video and audio tracks
  const tracks = useTracks(
    participants.map((participant) => participant.sid),
    {
      onlySubscribed: true,
      sources: [Track.Source.Camera, Track.Source.Microphone, Track.Source.ScreenShare],
    }
  );

  useEffect(() => {
    if (!room) return;
    
    const handleParticipantConnected = (participant) => {
      console.log('Participant connected:', participant.identity);
    };
    
    const handleParticipantDisconnected = (participant) => {
      console.log('Participant disconnected:', participant.identity);
    };
    
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    
    return () => {
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    };
  }, [room]);

  const toggleMute = async () => {
    if (!localParticipant) return;
    
    const micTrack = localParticipant.getTrack(Track.Source.Microphone);
    if (micTrack) {
      if (isMuted) {
        await micTrack.unmute();
      } else {
        await micTrack.mute();
      }
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = async () => {
    if (!localParticipant) return;
    
    const cameraTrack = localParticipant.getTrack(Track.Source.Camera);
    if (cameraTrack) {
      if (isCameraOff) {
        await cameraTrack.unmute();
      } else {
        await cameraTrack.mute();
      }
      setIsCameraOff(!isCameraOff);
    }
  };

  const leaveRoom = () => {
    if (room) {
      room.disconnect();
      window.location.reload(); // Simple way to reset the UI
    }
  };

  if (!room) {
    return <div className="video-chat-loading">Loading video chat...</div>;
  }

  return (
    <div className="video-chat-container">
      <div className="video-grid">
        {/* Local participant video */}
        {localParticipant && (
          <div className="video-tile local-participant">
            <div className="video-wrapper">
              {localParticipant.isCameraEnabled && (
                <VideoTrack
                  participant={localParticipant}
                  source={Track.Source.Camera}
                />
              )}
              {!localParticipant.isCameraEnabled && (
                <div className="video-placeholder">
                  <span>{localParticipant.identity?.charAt(0) || '?'}</span>
                </div>
              )}
            </div>
            <div className="participant-info">
              <span>{localParticipant.identity} (You)</span>
              {localParticipant.isMicrophoneEnabled ? null : <span className="muted-indicator">🔇</span>}
            </div>
          </div>
        )}
        
        {/* Remote participants */}
        {participants.map((participant) => (
          <div key={participant.sid} className="video-tile">
            <div className="video-wrapper">
              {participant.isCameraEnabled ? (
                <VideoTrack
                  participant={participant}
                  source={Track.Source.Camera}
                />
              ) : (
                <div className="video-placeholder">
                  <span>{participant.identity?.charAt(0) || '?'}</span>
                </div>
              )}
            </div>
            <AudioTrack participant={participant} source={Track.Source.Microphone} />
            <div className="participant-info">
              <span>{participant.identity}</span>
              {participant.isMicrophoneEnabled ? null : <span className="muted-indicator">🔇</span>}
            </div>
          </div>
        ))}
      </div>
      
      <div className="video-controls">
        <button 
          className={`control-button ${isMuted ? 'muted' : ''}`} 
          onClick={toggleMute}
        >
          {isMuted ? '🔇' : '🎤'}
        </button>
        <button 
          className={`control-button ${isCameraOff ? 'camera-off' : ''}`} 
          onClick={toggleCamera}
        >
          {isCameraOff ? '📵' : '📹'}
        </button>
        <button className="control-button leave" onClick={leaveRoom}>
          Leave
        </button>
      </div>
    </div>
  );
};

export default VideoChat;
