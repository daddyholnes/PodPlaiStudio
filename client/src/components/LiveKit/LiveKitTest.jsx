
import React, { useState } from 'react';
import { useLiveKit } from './LiveKitProvider';
import VideoChat from './VideoChat';

const LiveKitTest = () => {
  const [roomName, setRoomName] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [activeRoom, setActiveRoom] = useState('');
  const [activeParticipant, setActiveParticipant] = useState('');
  const [showVideoChat, setShowVideoChat] = useState(false);
  const { createAndJoinRoom, isConnecting, error } = useLiveKit();

  const handleCreateRoom = async () => {
    try {
      if (!roomName) {
        alert('Please enter a room name');
        return;
      }
      
      if (!participantName) {
        alert('Please enter your name');
        return;
      }
      
      const createdRoom = await createAndJoinRoom(roomName);
      setActiveRoom(createdRoom);
      setActiveParticipant(participantName);
      setShowVideoChat(true);
    } catch (err) {
      console.error("Error creating room:", err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">LiveKit Test</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      {!showVideoChat ? (
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Room Name:</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter room name"
            />
          </div>
          
          <div>
            <label className="block mb-2">Your Name:</label>
            <input
              type="text"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter your name"
            />
          </div>
          
          <button
            onClick={handleCreateRoom}
            disabled={isConnecting || !roomName || !participantName}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            {isConnecting ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <VideoChat roomName={activeRoom} identity={activeParticipant} />
          
          <button
            onClick={() => setShowVideoChat(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Leave Room
          </button>
        </div>
      )}
    </div>
  );
};

export default LiveKitTest;
