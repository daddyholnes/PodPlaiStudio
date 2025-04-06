
import React from 'react';
import { 
  LiveKitRoom, 
  VideoConference,
  RoomAudioRenderer
} from '@livekit/components-react';
import '@livekit/components-styles';
import { fetchRoomToken } from '../../services/liveKitService';

const VideoChat = ({ roomName, participantName }) => {
  const [token, setToken] = React.useState(null);
  const [error, setError] = React.useState(null);
  
  React.useEffect(() => {
    const getToken = async () => {
      try {
        if (!roomName || !participantName) {
          throw new Error('Room name and participant name are required');
        }
        
        const token = await fetchRoomToken(roomName, participantName);
        setToken(token);
      } catch (err) {
        console.error('Error getting token:', err);
        setError(err.message);
      }
    };
    
    getToken();
  }, [roomName, participantName]);
  
  if (error) {
    return <div className="p-4 bg-red-100 text-red-800 rounded">Error: {error}</div>;
  }
  
  if (!token) {
    return <div className="p-4">Loading connection...</div>;
  }
  
  return (
    <div className="video-chat-container">
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl="wss://dartopia-gvu1e64v.livekit.cloud"
        // Use data attributes for styling
        data-lk-theme="default"
        style={{ height: '400px', width: '100%' }}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
};

export default VideoChat;
import React from 'react';
import { 
  AudioTrack,
  VideoTrack,
  ConnectionState,
  ParticipantTile,
  useParticipants,
  useTracks,
  useConnectionState,
  useRoomContext
} from '@livekit/components-react';
import LiveKitProvider from './LiveKitProvider';

const VideoChat = ({ roomName, participantName }) => {
  if (!roomName || !participantName) {
    return <div className="p-4 bg-red-100 text-red-800">Room name and participant name are required</div>;
  }
  
  return (
    <div className="video-chat-container">
      <LiveKitProvider roomName={roomName} participantName={participantName}>
        <RoomContent />
      </LiveKitProvider>
    </div>
  );
};

const RoomContent = () => {
  const participants = useParticipants();
  const connectionState = useConnectionState();
  const tracks = useTracks();

  // Check connection status
  if (connectionState !== ConnectionState.Connected) {
    return (
      <div className="flex items-center justify-center h-40">
        <p>Connection status: {connectionState}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {participants.map((participant) => (
          <ParticipantTile key={participant.identity} participant={participant} />
        ))}
      </div>

      {participants.length === 0 && (
        <div className="text-center p-4 bg-yellow-100 rounded">
          <p>No other participants in the room.</p>
        </div>
      )}
    </div>
  );
};

export default VideoChat;
