import axios from 'axios';

/**
 * Fetches a LiveKit token for a specific room and identity
 * @param {string} roomName - Name of the room to join
 * @param {string} identity - User identity (unique identifier)
 * @returns {Promise<Object>} Token data
 */
export const fetchRoomToken = async (roomName, identity) => {
  try {
    console.log(`Fetching token for room: ${roomName}, identity: ${identity}`);
    const response = await axios.get(`/livekit/token?room=${encodeURIComponent(roomName)}&identity=${encodeURIComponent(identity)}`);
    console.log('Token response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching LiveKit token:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch LiveKit token');
  }
};

/**
 * Creates a new LiveKit room
 * @param {Object} params - Room creation parameters
 * @param {string} params.roomName - Name of the room to create
 * @returns {Promise<Object>} Room data
 */
export const createRoom = async ({ roomName }) => {
  try {
    console.log(`Creating room: ${roomName}`);
    const response = await axios.post('/livekit/rooms', { roomName });
    console.log('Create room response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating LiveKit room:', error);
    throw new Error(error.response?.data?.error || 'Failed to create LiveKit room');
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
    console.error('Error listing rooms:', error);
    throw new Error(error.response?.data?.error || 'Failed to list rooms');
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