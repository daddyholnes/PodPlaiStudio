import axios from 'axios';

const API_BASE_URL = '/api/terminal';

/**
 * Executes a command in the terminal
 * @param {string} command - The command to execute
 * @param {string} sessionId - The terminal session ID
 * @returns {Promise<Object>} Command execution result
 */
export const executeCommand = async (command, sessionId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/execute`, {
      command,
      sessionId
    });
    return response.data;
  } catch (error) {
    console.error('Error executing command:', error);
    throw new Error('Failed to execute command');
  }
};

/**
 * Creates a new terminal session
 * @returns {Promise<Object>} Session details including sessionId
 */
export const createTerminalSession = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/sessions`);
    return response.data;
  } catch (error) {
    console.error('Error creating terminal session:', error);
    throw new Error('Failed to create terminal session');
  }
};

/**
 * Terminates a terminal session
 * @param {string} sessionId - The terminal session ID to terminate
 * @returns {Promise<Object>} Termination result
 */
export const terminateTerminalSession = async (sessionId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error terminating terminal session:', error);
    throw new Error('Failed to terminate terminal session');
  }
};
