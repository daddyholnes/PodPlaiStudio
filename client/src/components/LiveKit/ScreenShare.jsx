
import React, { useState } from 'react';
import { 
  useLocalParticipant,
  useScreenShare
} from '@livekit/components-react';

const ScreenShare = () => {
  const { localParticipant } = useLocalParticipant();
  const { isScreenShareEnabled, toggleScreenShare } = useScreenShare();
  const [error, setError] = useState(null);
  
  const handleScreenShareToggle = async () => {
    try {
      await toggleScreenShare();
      setError(null);
    } catch (err) {
      console.error('Screen share error:', err);
      setError(err.message || 'Failed to share screen');
    }
  };
  
  // Check if LiveKit is properly connected
  if (!localParticipant) {
    return (
      <div className="screen-share-placeholder">
        <div className="screen-share-disabled-notice">
          <p>Waiting for LiveKit connection...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="screen-share-container">
      <div className="screen-share-controls">
        <button 
          className={`screen-share-button ${isScreenShareEnabled ? 'active' : ''}`}
          onClick={handleScreenShareToggle}
          aria-label={isScreenShareEnabled ? 'Stop sharing' : 'Share screen'}
        >
          {isScreenShareEnabled ? 'Stop Sharing' : 'Share Screen'}
        </button>
        
        {error && (
          <p className="screen-share-error">{error}</p>
        )}
        
        <p className="screen-share-status">
          {isScreenShareEnabled 
            ? 'Your screen is being shared' 
            : 'Start sharing your screen'}
        </p>
      </div>
    </div>
  );
};

export default ScreenShare;
