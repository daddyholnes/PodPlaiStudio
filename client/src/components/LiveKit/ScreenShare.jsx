import React, { useState } from 'react';
import { useLocalParticipant, useRoom, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';

const ScreenShare = () => {
  // Add a conditional check for room context
  const roomContext = useRoom();
  const room = roomContext?.room;

  // Only attempt to use LiveKit hooks if we're in a room context
  const tracks = room ? useTracks() : [];
  const { localParticipant } = room ? useLocalParticipant() : { localParticipant: null };

  // If no room is available, render a placeholder
  if (!room) {
    return (
      <div className="screen-share-placeholder">
        <p>Screen sharing requires an active LiveKit room. Please join a room first.</p>
        <button 
          className="join-room-btn"
          onClick={() => console.log('Room joining should be implemented')}
        >
          Join Room
        </button>
      </div>
    );
  }

  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const toggleScreenShare = async () => {
    if (!localParticipant) return;

    if (isScreenSharing) {
      // Stop screen sharing
      localParticipant.tracks.forEach((publication) => {
        if (
          publication.track &&
          publication.track.source === Track.Source.ScreenShare
        ) {
          publication.track.stop();
          localParticipant.unpublishTrack(publication.track);
        }
      });
      setIsScreenSharing(false);
    } else {
      try {
        // Start screen sharing
        if (!localParticipant?.room) {
          console.error('Room not available');
          return;
        }
        
        const screenTrack = await localParticipant.room.localParticipant.createScreenShareTrack({
          audio: true,
          resolution: { width: 1920, height: 1080 },
        });
        
        await localParticipant.publishTrack(screenTrack);
        setIsScreenSharing(true);
      } catch (error) {
        console.error('Error sharing screen:', error);
        // User likely canceled the screen share prompt
        setIsScreenSharing(false);
      }
    }
  };

  return (
    <button 
      className={`screen-share-button ${isScreenSharing ? 'active' : ''}`}
      onClick={toggleScreenShare}
      aria-label="Toggle screen sharing"
      aria-pressed={isScreenSharing}
    >
      {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
    </button>
  );
};

export default ScreenShare;
