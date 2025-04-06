import React, { useEffect, useState } from 'react';
import './VideoChat.css';

const VideoChat = ({ token, roomName }) => {
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    if (!token) {
      setStatus('No token provided');
      return;
    }

    setStatus(`Connected to room: ${roomName}`);

    // In a real implementation, you would connect to LiveKit here
    // For example, using the LiveKit React SDK:
    // 
    // import { useRoom } from 'livekit-react';
    // const { room, participants } = useRoom(token);

    return () => {
      // Cleanup when component unmounts
      setStatus('Disconnected');
    };
  }, [token, roomName]);

  return (
    <div className="video-chat">
      <div className="status-message">{status}</div>

      <div className="video-placeholder">
        <div className="placeholder-text">
          Video streams would appear here when connected to LiveKit.
          <p>Room: {roomName}</p>
          <p>Token is available and ready for LiveKit SDK connection</p>
        </div>
      </div>
    </div>
  );
};

export default VideoChat;