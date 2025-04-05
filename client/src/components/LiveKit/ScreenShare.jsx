import React, { useState } from 'react';
import { useLocalParticipant, useRoom } from '@livekit/components-react';
import { Track } from 'livekit-client';

const ScreenShare = () => {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const { localParticipant } = useLocalParticipant();
  const room = useRoom();

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
        const screenTrack = await room.localParticipant.createScreenShareTrack({
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
