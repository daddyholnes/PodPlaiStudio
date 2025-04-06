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
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomError, setRoomError] = useState(null);

  useEffect(() => {
    if (!room) return;
    
    const createRoom = async () => {
      setIsCreatingRoom(true);
      try {
        const response = await fetch('/api/livekit/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName: room })
        });
        if (!response.ok) throw new Error('Failed to create room');
      } catch (err) {
        setRoomError(err.message);
        onError?.(err);
      } finally {
        setIsCreatingRoom(false);
      }
    };
    createRoom();
  }, [room]);

  if (!token || !serverUrl) {
    return (
      <div className="livekit-provider-placeholder">
        <p>Please provide LiveKit token and server URL.</p>
      </div>
    );
  }

  if (isCreatingRoom) {
    return (
      <div className="livekit-provider-placeholder">
        <p>Creating room...</p>
      </div>
    );
  }

  if (roomError) {
    return (
      <div className="livekit-provider-placeholder">
        <p>Error creating room: {roomError}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
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
