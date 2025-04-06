import React from 'react';
import { 
  VideoConference,
  ControlBar,
  useConnectionState,
  ConnectionState
} from '@livekit/components-react';
import LiveKitProvider from './LiveKitProvider';
import '@livekit/components-styles';

const VideoConferenceWithControls = () => {
  const connectionState = useConnectionState();

  if (connectionState !== ConnectionState.Connected) {
    return (
      <div className="livekit-connecting">
        <p>Connection status: {connectionState}</p>
        <p>Please wait while connecting to room...</p>
      </div>
    );
  }

  return (
    <div className="video-conference-container">
      <VideoConference />
      <ControlBar />
    </div>
  );
};

const VideoChat = ({ roomName = 'default-room' }) => {
  return (
    <div className="video-chat-wrapper">
      <LiveKitProvider roomName={roomName}>
        <VideoConferenceWithControls />
      </LiveKitProvider>
    </div>
  );
};

export default VideoChat;