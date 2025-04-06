
import React, { useState, useEffect } from 'react';
import { fetchRoomToken } from '../../services/liveKitService';

const LiveKitProvider = ({ children, roomName, participantName }) => {
  const [token, setToken] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roomName || !participantName) {
      console.error('Room name or participant name is missing');
      return;
    }

    const getToken = async () => {
      setIsConnecting(true);
      try {
        console.log(`Fetching token for room: ${roomName}, participant: ${participantName}`);
        const tokenData = await fetchRoomToken(roomName, participantName);
        
        if (tokenData && tokenData.token) {
          console.log('Token received for room:', roomName);
          setToken(tokenData.token);
          setIsConnected(true);
        } else {
          throw new Error('Invalid token response');
        }
      } catch (err) {
        console.error('Failed to fetch LiveKit token:', err);
        setError(err.message || 'Failed to connect to LiveKit');
      } finally {
        setIsConnecting(false);
      }
    };

    getToken();
  }, [roomName, participantName]);

  if (isConnecting) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Connecting to LiveKit room...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
        <p>Error connecting to LiveKit: {error}</p>
        <p>Please check your configuration and try again.</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Waiting for LiveKit connection...</p>
      </div>
    );
  }

  return (
    <div className="livekit-provider">
      <div style={{ padding: '10px', backgroundColor: '#e6f7ff', marginBottom: '15px', borderRadius: '4px' }}>
        <p style={{ margin: 0 }}>Connected to LiveKit room: <strong>{roomName}</strong> as <strong>{participantName}</strong></p>
      </div>
      {children}
    </div>
  );
};

export default LiveKitProvider;
