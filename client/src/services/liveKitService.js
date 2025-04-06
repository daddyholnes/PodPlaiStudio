
import axios from 'axios';

/**
 * Fetches a LiveKit access token from the server
 * @param {string} roomName - The name of the room to join
 * @param {string} identity - The identity of the participant
 * @returns {Promise<{token: string, url: string}>} Token and LiveKit server URL
 */
export const fetchRoomToken = async (roomName, identity) => {
  try {
    console.log(`Fetching token for room: ${roomName}, identity: ${identity}`);
    const response = await axios.get('/livekit/token', {
      params: {
        room: roomName,
        identity: identity
      }
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
    const response = await axios.post('/livekit/rooms', {
      roomName
    });

    return response.data;
  } catch (error) {
    console.error('Error creating LiveKit room:', error);
    throw error;
  }
};

/**
 * Lists all available LiveKit rooms
 * @returns {Promise<Array>} List of rooms
 */
export const listRooms = async () => {
  try {
    const response = await axios.get('/livekit/rooms');
    return response.data.rooms;
  } catch (error) {
    console.error('Error listing LiveKit rooms:', error);
    throw error;
  }
};

/**
 * Deletes a LiveKit room
 * @param {string} roomName - The name of the room to delete
 * @returns {Promise<void>}
 */
export const deleteRoom = async (roomName) => {
  try {
    await axios.delete(`/livekit/rooms/${roomName}`);
  } catch (error) {
    console.error('Error deleting room:', error);
    throw new Error('Failed to delete room');
  }
};

/**
 * Lists participants in a room
 * @param {string} roomName - The name of the room
 * @returns {Promise<Array>} List of participants
 */
export const listParticipants = async (roomName) => {
  try {
    const response = await axios.get(`/livekit/rooms/${roomName}/participants`);
    return response.data.participants;
  } catch (error) {
    console.error('Error listing participants:', error);
    throw new Error('Failed to list participants');
  }
};

/**
 * Removes a participant from a room
 * @param {string} roomName - The name of the room
 * @param {string} identity - The identity of the participant to remove
 * @returns {Promise<void>}
 */
export const removeParticipant = async (roomName, identity) => {
  try {
    await axios.delete(`/livekit/rooms/${roomName}/participants/${identity}`);
  } catch (error) {
    console.error('Error removing participant:', error);
    throw new Error('Failed to remove participant');
  }
};

export default {
  fetchRoomToken,
  createRoom,
  listRooms,
  deleteRoom,
  listParticipants,
  removeParticipant
};
