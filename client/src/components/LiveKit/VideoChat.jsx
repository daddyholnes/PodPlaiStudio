
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
