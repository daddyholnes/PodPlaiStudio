import React, { useEffect, useState } from 'react';
import { 
  VideoConference,
  ControlBar,
  useTracks
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { withLiveKitProvider } from './LiveKitProvider';

const VideoChat = ({ liveKitAvailable }) => {
  // Handle case when LiveKit is not available
  if (!liveKitAvailable) {
    return (
      <div className="video-chat-placeholder">
        <p>Video chat requires LiveKit configuration. Please check your environment variables.</p>
      </div>
    );
  }
  
  return (
    <div className="video-chat-container">
      <VideoConference />
      <ControlBar />
    </div>
  );
};

// Export the wrapped component to ensure it has LiveKit context
export default withLiveKitProvider(VideoChat);
