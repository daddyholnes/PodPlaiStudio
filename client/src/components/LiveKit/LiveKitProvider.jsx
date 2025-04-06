
import React from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';

const LiveKitProvider = ({ children, roomName, participantName }) => {
  // For simplicity, we'll hardcode the LiveKit server URL in this component
  // In production, you'd want to use environment variables
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
        const response = await fetch(`/livekit/token?room=${roomName}&identity=${participantName}`);
        const data = await response.json();
        
        if (data.token) {
          setToken(data.token);
        } else {
          throw new Error('Invalid token response');
        }
      } catch (err) {
        console.error('Failed to fetch token:', err);
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
