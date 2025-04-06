
import React, { useState } from 'react';
import { 
  LiveKitRoom, 
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import { fetchRoomToken } from '../../services/liveKitService';

const VideoChat = ({ roomName = '', identity = '' }) => {
  const [token, setToken] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  
  const connect = async () => {
    if (!roomName || !identity) {
      setError('Room name and participant name are required');
      return;
    }
    
    try {
      setIsConnecting(true);
      setError('');
      const { token: newToken, url } = await fetchRoomToken(roomName, identity);
      setToken(newToken);
      setServerUrl(url);
    } catch (err) {
      console.error('Failed to get token', err);
      setError(`Failed to connect: ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  };
  
  if (!token || !serverUrl) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl mb-4">Join Video Chat</h2>
        {error && <div className="p-3 mb-4 bg-red-100 text-red-800 rounded">{error}</div>}
        <div className="mb-3">
          <label className="block mb-1">Room Name: {roomName}</label>
        </div>
        <div className="mb-3">
          <label className="block mb-1">Your Name: {identity}</label>
        </div>
        <button
          onClick={connect}
          disabled={isConnecting || !roomName || !identity}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          {isConnecting ? 'Connecting...' : 'Join Room'}
        </button>
      </div>
    );
  }
  
  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      audio={true}
      video={true}
      connectOptions={{ autoSubscribe: true }}
      data-lk-theme="default"
      style={{ height: '100%', width: '100%' }}
    >
      <div className="video-container" style={{ height: '100%', width: '100%' }}>
        <VideoConference />
        <RoomAudioRenderer />
        <ControlBar />
      </div>
    </LiveKitRoom>
  );
};

function VideoConference() {
  // Request all tracks, but only media and unknown types (not screen_share, etc)
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.Microphone },
      { source: Track.Source.Unknown },
    ],
  );
  
  return (
    <GridLayout tracks={tracks} style={{ height: 'calc(100% - 64px)' }}>
      <ParticipantTile />
    </GridLayout>
  );
}

export default VideoChat;
