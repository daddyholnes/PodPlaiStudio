import React, { useState, useEffect } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import { fetchRoomToken } from '../../services/liveKitService';

const LiveKitProvider = ({ children, roomName, participantName }) => {
  const [token, setToken] = useState(null);
  const serverUrl = import.meta.env.VITE_LIVEKIT_SERVER_URL || 'wss://dartopia-gvu1e64v.livekit.cloud';

  useEffect(() => {
    if (!roomName || !participantName) {
      console.error('Room name or participant name is missing');
      return;
    }

    const getToken = async () => {
      try {
        console.log(`Fetching token for room: ${roomName}, participant: ${participantName}`);
        const tokenData = await fetchRoomToken(roomName, participantName);
        console.log('Token received for room:', roomName);
        setToken(tokenData.token);
      } catch (error) {
        console.error('Failed to fetch LiveKit token:', error);
      }
    };

    getToken();
  }, [roomName, participantName]);

  if (!token) {
    return <div>Loading LiveKit connection...</div>;
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      audio={false}
      video={false}
      connectOptions={{
        autoSubscribe: true
      }}
      onConnected={() => console.log('Connected to LiveKit room:', roomName)}
      onError={(err) => console.error('LiveKit connection error:', err)}
    >
      {children}
    </LiveKitRoom>
  );
};

export default LiveKitProvider;