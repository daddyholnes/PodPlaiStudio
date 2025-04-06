
import React, { useState } from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import { useLiveKit } from './LiveKitProvider';

const ScreenShare = () => {
  const { isConnected } = useLiveKit();
  const { localParticipant } = useLocalParticipant();
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState(null);
  
  const startScreenShare = async () => {
    if (!localParticipant) return;
    
    try {
      await localParticipant.setScreenShareEnabled(true);
      setIsSharing(true);
      setError(null);
    } catch (err) {
      console.error('Failed to start screen sharing:', err);
      setError(err.message || 'Failed to start screen sharing');
    }
  };
  
  const stopScreenShare = async () => {
    if (!localParticipant) return;
    
    try {
      await localParticipant.setScreenShareEnabled(false);
      setIsSharing(false);
    } catch (err) {
      console.error('Failed to stop screen sharing:', err);
      setError(err.message || 'Failed to stop screen sharing');
    }
  };
  
  if (!isConnected) {
    return (
      <div className="screen-share-placeholder">
        <p>Waiting for LiveKit connection...</p>
      </div>
    );
  }
  
  return (
    <div className="screen-share-container">
      <div className="screen-share-controls">
        {!isSharing ? (
          <button 
            className="screen-share-button"
            onClick={startScreenShare}
            disabled={!localParticipant}
          >
            Start Screen Sharing
          </button>
        ) : (
          <button 
            className="screen-share-button active"
            onClick={stopScreenShare}
          >
            Stop Screen Sharing
          </button>
        )}
        
        {error && (
          <p className="screen-share-error">Error: {error}</p>
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
