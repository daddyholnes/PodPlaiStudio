
import React, { useState } from 'react';
import { useLocalParticipant } from '@livekit/components-react';

const ScreenShare = () => {
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState(null);
  const { localParticipant } = useLocalParticipant();
  
  const startScreenShare = async () => {
    if (!localParticipant) {
      setError('LiveKit connection not established');
      return;
    }
    
    try {
      await localParticipant.setScreenShareEnabled(true);
      setIsSharing(true);
      setError(null);
    } catch (err) {
      console.error('Screen share error:', err);
      setError(err.message || 'Failed to share screen');
      setIsSharing(false);
    }
  };
  
  const stopScreenShare = async () => {
    if (!localParticipant) return;
    
    try {
      await localParticipant.setScreenShareEnabled(false);
      setIsSharing(false);
    } catch (err) {
      console.error('Error stopping screen share:', err);
      setError(err.message);
    }
  };
  
  if (!localParticipant) {
    return (
      <div className="screen-share-placeholder">
        <p>Waiting for LiveKit connection...</p>
      </div>
    );
  }
  
  return (
    <div className="screen-share-container">
      <div className="screen-share-controls">
        <button 
          className={`screen-share-button ${isSharing ? 'active' : ''}`}
          onClick={isSharing ? stopScreenShare : startScreenShare}
          aria-label={isSharing ? 'Stop sharing' : 'Share screen'}
        >
          {isSharing ? 'Stop Sharing' : 'Share Screen'}
        </button>
        
        {error && (
          <p className="screen-share-error">{error}</p>
        )}
        
        <p className="screen-share-status">
          {isSharing 
            ? 'Your screen is being shared' 
            : 'Click to share your screen'}
        </p>
      </div>
    </div>
  );
};

export default ScreenShare;
