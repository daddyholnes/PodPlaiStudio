
import React, { useState, useEffect } from 'react';

const VideoChat = () => {
  return (
    <div className="video-chat-container">
      <h3>Video Chat Component</h3>
      <p>This component will integrate with LiveKit for video functionality</p>
      <div className="participants-area" style={{ 
        border: '1px solid #ddd', 
        padding: '20px', 
        borderRadius: '5px',
        marginTop: '15px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '200px',
        backgroundColor: '#f5f5f5'
      }}>
        <p>Video participants will appear here</p>
        <button style={{
          marginTop: '10px',
          padding: '8px 16px',
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Turn on Camera
        </button>
      </div>
    </div>
  );
};

export default VideoChat;
