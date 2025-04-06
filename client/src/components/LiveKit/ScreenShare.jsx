import React from 'react';

const ScreenShare = () => {
  return (
    <div className="screen-share-container" style={{ marginTop: '20px' }}>
      <h3>Screen Sharing</h3>
      <p>This component will enable screen sharing functionality</p>
      <div style={{ 
        border: '1px solid #ddd', 
        padding: '20px', 
        borderRadius: '5px',
        marginTop: '15px',
        textAlign: 'center',
        backgroundColor: '#f5f5f5',
        height: '150px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p>Screen share content will appear here</p>
        <button style={{
          marginTop: '10px',
          padding: '8px 16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Share Screen
        </button>
      </div>
    </div>
  );
};

export default ScreenShare;
import React, { useState } from 'react';
import { useLocalParticipant, Track } from 'livekit-react';

const ScreenShare = () => {
  const { localParticipant } = useLocalParticipant();
  const [isSharing, setIsSharing] = useState(false);

  const toggleScreenShare = async () => {
    if (!localParticipant) return;

    try {
      if (isSharing) {
        // Stop screen sharing
        await localParticipant.stopScreenShare();
        setIsSharing(false);
      } else {
        // Start screen sharing
        await localParticipant.enableScreenShare();
        setIsSharing(true);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  return (
    <div className="screen-share-container">
      <button 
        className={`screen-share-button ${isSharing ? 'active' : ''}`}
        onClick={toggleScreenShare}
      >
        {isSharing ? 'Stop Sharing' : 'Share Screen'}
      </button>
    </div>
  );
};

export default ScreenShare;
