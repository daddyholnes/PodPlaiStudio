import React from 'react';

// Create a simplified placeholder component that doesn't use LiveKit hooks
const ScreenShare = () => {
  return (
    <div className="screen-share-placeholder">
      <div className="screen-share-disabled-notice">
        <p>Screen sharing is temporarily disabled</p>
        <button 
          className="screen-share-button disabled"
          disabled={true}
          aria-label="Screen sharing disabled"
        >
          Share Screen (Disabled)
        </button>
        <p className="screen-share-status">
          LiveKit integration is being updated. Please check back later.
        </p>
      </div>
    </div>
  );
};

export default ScreenShare;
