import axios from 'axios';

const API_BASE_URL = '/api/livekit';

/**
 * Fetches a LiveKit token for room access
 * @param {string} roomName - The name of the room to join
 * @param {string} participantName - The display name of the participant
 * @returns {Promise<string>} A LiveKit JWT token
 */
export const fetchRoomToken = async (roomName = 'default-room', participantName = `user-${Date.now()}`) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/token`, {
      roomName,
      participantName
    });
    return response.data.token;
  } catch (error) {
    console.error('Error fetching LiveKit token:', error);
    throw new Error('Failed to fetch room token');
  }
};

/**
 * Creates a new LiveKit room
 * @param {string} roomName - The name of the room to create
 * @returns {Promise<Object>} Room details
 */
export const createRoom = async (roomName) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/rooms`, { roomName });
    return response.data;
  } catch (error) {
    console.error('Error creating room:', error);
    throw new Error('Failed to create room');
  }
};

/**
 * Lists all available LiveKit rooms
 * @returns {Promise<Array>} List of rooms
 */
export const listRooms = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/rooms`);
    return response.data.rooms;
  } catch (error) {
    console.error('Error listing rooms:', error);
    throw new Error('Failed to list rooms');
  }
};
