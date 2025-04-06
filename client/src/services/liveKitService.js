import axios from 'axios';

/**
 * Fetches a LiveKit access token from the server
 * @param {string} roomName - The name of the room to join
 * @param {string} identity - The identity of the participant
 * @returns {Promise<{token: string}>} Token for LiveKit server
 */
export const fetchRoomToken = async (roomName, identity) => {
  try {
    console.log(`Fetching token for room: ${roomName}, identity: ${identity}`);
    const response = await axios.post('/api/livekit/token', {
      roomName,
      participantName: identity
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching room token:', error);
    throw error;
  }
};

/**
 * Creates a new LiveKit room
 * @param {Object} params - Room parameters
 * @param {string} params.roomName - The name of the room to create
 * @returns {Promise<Object>} Room details
 */
export const createRoom = async ({ roomName }) => {
  try {
    console.log(`Creating room: ${roomName}`);
    const response = await axios.post('/api/livekit/create-room', {
      roomName
    });

    return response.data;
  } catch (error) {
    console.error('Error creating LiveKit room:', error);
    throw error;
  }
};

export default {
  fetchRoomToken,
  createRoom
};