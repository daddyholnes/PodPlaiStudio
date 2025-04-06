
import React, { useState, useEffect } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles'; // Import CSS for LiveKit components
import { fetchRoomToken } from '../../services/liveKitService';

const LiveKitProvider = ({ children, roomName, participantName }) => {
  // For simplicity using the LiveKit cloud instance from your server
  const serverUrl = 'wss://dartopia-gvu1e64v.livekit.cloud';
  
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!roomName || !participantName) {
      setError("Room name and participant name are required");
      setIsLoading(false);
      return;
    }

    const getToken = async () => {
      try {
        console.log(`Fetching token for room: ${roomName}, participant: ${participantName}`);
        const token = await fetchRoomToken(roomName, participantName);
        setToken(token);
      } catch (err) {
        console.error('Failed to fetch LiveKit token:', err);
        setError(err.message || 'Failed to connect to LiveKit');
      } finally {
        setIsLoading(false);
      }
    };

    getToken();
  }, [roomName, participantName]);

  if (isLoading) {
    return <div>Loading LiveKit connection...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  if (!token) {
    return <div>Waiting for LiveKit token...</div>;
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={serverUrl}
      data-lk-theme="default"
      style={{ height: '100%' }}
    >
      {children}
    </LiveKitRoom>
  );
};

export default LiveKitProvider;
