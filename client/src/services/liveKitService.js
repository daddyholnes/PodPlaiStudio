
import axios from 'axios';

/**
 * Fetches a LiveKit token for a specific room and participant
 * @param {string} roomName - The name of the room to join
 * @param {string} identity - The identity of the participant
 * @returns {Promise<string>} The token
 */
export const fetchRoomToken = async (roomName, identity) => {
  try {
    console.log(`Fetching token for room: ${roomName}, identity: ${identity}`);
    const response = await axios.get(`/livekit/token`, {
      params: {
        room: roomName,
        identity: identity
      }
    });

    return response.data.token;
  } catch (error) {
    console.error('Error fetching LiveKit token:', error);
    throw new Error('Failed to fetch LiveKit token');
  }
};

/**
 * Creates a new LiveKit room
 * @param {Object} options - Room creation options
 * @param {string} options.roomName - The name of the room to create
 * @returns {Promise<Object>} Room creation result
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
    throw new Error('Failed to create LiveKit room');
  }
};

/**
 * Fetches a list of active LiveKit rooms
 * @returns {Promise<Array>} List of rooms
 */
export const listRooms = async () => {
  try {
    const response = await axios.get('/livekit/rooms');
    return response.data.rooms;
  } catch (error) {
    console.error('Error listing LiveKit rooms:', error);
    throw new Error('Failed to list LiveKit rooms');
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
