import React from 'react';
import { 
  ConnectionState,
  ParticipantTile,
  useParticipants,
  useConnectionState,
} from '@livekit/components-react';
import '@livekit/components-styles';
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