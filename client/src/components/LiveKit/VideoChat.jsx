
import React from 'react';
import { 
  VideoConference,
  ControlBar,
  useLocalParticipant,
  useConnectionState,
  ConnectionState
} from '@livekit/components-react';
import { withLiveKitProvider } from './LiveKitProvider';
import ScreenShare from './ScreenShare';

const VideoChat = ({ roomName = 'default-room', liveKitAvailable }) => {
  const { localParticipant } = useLocalParticipant();
  const connectionState = useConnectionState();
  
  // Handle case when LiveKit is not available
  if (!liveKitAvailable) {
    return (
      <div className="video-chat-placeholder">
        <p>Video chat requires LiveKit configuration. Please check your environment variables.</p>
      </div>
    );
  }
  
  if (connectionState === ConnectionState.Connecting) {
    return (
      <div className="video-chat-loading">
        <p>Connecting to LiveKit room: {roomName}...</p>
      </div>
    );
  }
  
  if (connectionState === ConnectionState.Disconnected || 
      connectionState === ConnectionState.Failed) {
    return (
      <div className="video-chat-error">
        <p>Failed to connect to LiveKit room. Please try again.</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }
  
  return (
    <div className="video-chat-container">
      <div className="video-chat-header">
        <h3>Room: {roomName}</h3>
        {localParticipant && (
          <div className="participant-info">
            Connected as: {localParticipant.identity}
          </div>
        )}
      </div>
      
      <div className="video-conference-wrapper">
        <VideoConference />
      </div>
      
      <div className="video-controls">
        <ScreenShare />
        <ControlBar />
      </div>
    </div>
  );
};

// Export the wrapped component to ensure it has LiveKit context
export default withLiveKitProvider(VideoChat);
