import React, { useState } from 'react';
import { useLocalParticipant } from '@livekit/components-react';

const ScreenShare = () => {
  const { localParticipant } = useLocalParticipant();
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState(null); // Retained from original for error handling

  const toggleScreenShare = async () => {
    if (!localParticipant) {
      console.error('No local participant found');
      return;
    }

    try {
      if (isSharing) {
        // Stop screen sharing
        await localParticipant.setScreenShareEnabled(false);
        setIsSharing(false);
        setError(null); // Clear error on successful stop
      } else {
        // Start screen sharing
        await localParticipant.setScreenShareEnabled(true);
        setIsSharing(true);
        setError(null); // Clear error on successful start
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      setError(error.message || 'Error toggling screen share'); // Set error message
    }
  };

  return (
    <div className="screen-share-container">
      <button 
        className="screen-share-button"
        onClick={toggleScreenShare}
      >
        {isSharing ? 'Stop Sharing' : 'Share Screen'}
      </button>
      <p className="screen-share-status">
        {isSharing 
          ? 'Your screen is being shared' 
          : 'Click to share your screen'}
      </p>
    </div>
  );
};

export default ScreenShare;