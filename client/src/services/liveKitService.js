import axios from 'axios';

const API_BASE_URL = '/api/livekit';

/**
 * Fetches a LiveKit token for room access
 * @param {string} roomName - The name of the room to join
 * @param {string} participantName - The display name of the participant
 * @returns {Promise<string>} A LiveKit JWT token
 */
export const fetchRoomToken = async (roomName, participantName) => {
  try {
    console.log(`Fetching token for room: ${roomName}, participant: ${participantName}`);
    const response = await axios.get('/livekit/token', {
      params: {
        room: roomName || 'default-room',
        identity: participantName
      }
    });
    return response.data.token;
  } catch (error) {
    console.error("Error fetching LiveKit token:", error);
    throw error;
  }
};

/**
 * Creates a new LiveKit room
 * @param {Object} options - Room creation options
 * @param {string} options.roomName - The name of the room to create
 * @returns {Promise<Object>} Room details
 */
export const createRoom = async ({ roomName }) => {
  try {
    console.log(`Creating room: ${roomName}`);
    const response = await axios.post('/livekit/rooms', { roomName });
    console.log('Room created:', response.data);
    return response.data.room;
  } catch (error) {
    console.error('Error creating room:', error);
    throw new Error('Failed to create room');
  }
};

/**
 * Lists all available LiveKit rooms
 * @param {string[]} [roomNames] - Optional list of room names to filter by
 * @returns {Promise<Array>} List of rooms
 */
export const listRooms = async (roomNames) => {
  try {
    const params = roomNames ? { names: roomNames.join(',') } : {};
    const response = await axios.get(`${API_BASE_URL}/rooms`, { params });
    return response.data.rooms;
  } catch (error) {
    console.error('Error listing rooms:', error);
    throw new Error('Failed to list rooms');
  }
};

/**
 * Deletes a LiveKit room
 * @param {string} roomName - The name of the room to delete
 * @returns {Promise<void>}
 */
export const deleteRoom = async (roomName) => {
  try {
    await axios.delete(`${API_BASE_URL}/rooms/${roomName}`);
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
    const response = await axios.get(`${API_BASE_URL}/rooms/${roomName}/participants`);
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
    await axios.delete(`${API_BASE_URL}/rooms/${roomName}/participants/${identity}`);
  } catch (error) {
    console.error('Error removing participant:', error);
    throw new Error('Failed to remove participant');
  }
};