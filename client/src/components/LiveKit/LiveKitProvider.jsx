import React from 'react';
import { 
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  ControlBar
} from '@livekit/components-react';
import '@livekit/components-styles';

const LiveKitProvider = ({ 
  children,
  token,
  serverUrl,
  room,
  onConnected,
  onDisconnected,
  onError
}) => {
  if (!token || !serverUrl) {
    return (
      <div className="livekit-provider-placeholder">
        <p>Please provide LiveKit token and server URL.</p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      room={room}
      onConnected={onConnected}
      onDisconnected={onDisconnected}
      onError={onError}
      data-lk-theme="default"
    >
      <RoomAudioRenderer />
      {children}
    </LiveKitRoom>
  );
};

// Higher-order component to wrap components that need LiveKit context
export const withLiveKitProvider = (Component) => {
  return function WrappedComponent(props) {
    // Check if we have LiveKit configuration from props or environment
    const token = props.token || import.meta.env.VITE_LIVEKIT_TOKEN;
    const serverUrl = props.serverUrl || import.meta.env.VITE_LIVEKIT_URL;
    const roomName = props.room || 'default-room';
    
    if (!token || !serverUrl) {
      console.warn('LiveKit token or server URL not provided. Component will render without LiveKit context.');
      
      return (
        <div className="livekit-context-missing">
          <Component {...props} liveKitAvailable={false} />
        </div>
      );
    }

    return (
      <LiveKitProvider 
        token={token} 
        serverUrl={serverUrl}
        room={roomName}
        onError={(error) => console.error('LiveKit error:', error)}
      >
        <Component {...props} liveKitAvailable={true} />
      </LiveKitProvider>
    );
  };
};

export default LiveKitProvider;
