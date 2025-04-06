import axios from 'axios';

const API_BASE_URL = '/api';

/**
 * Creates a new terminal session
 * @returns {Promise<Object>} The created session data
 */
export const createTerminalSession = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/terminal/sessions`);
    return response.data;
  } catch (error) {
    console.warn('Error creating terminal session, using fallback:', error.message);
    // Return a mock session for development/fallback
    return {
      id: `mock-${Date.now()}`,
      created: new Date().toISOString(),
      status: 'fallback'
    };
  }
};

/**
 * Sends a command to the terminal session
 * @param {string} sessionId - The terminal session ID
 * @param {string} command - The command to execute
 * @returns {Promise<Object>} Command execution result
 */
export const sendTerminalCommand = async (sessionId, command) => {
  if (!sessionId || !command) {
    console.error('Missing sessionId or command');
    return { error: 'Invalid parameters', output: '' };
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/terminal/sessions/${sessionId}/command`, {
      command
    });
    return response.data;
  } catch (error) {
    console.warn('Error sending command, using fallback:', error.message);
    // Return a mock response
    return {
      output: `Simulated output for: ${command}\n` +
              `(Terminal session ${sessionId} is in fallback mode)`
    };
  }
};

/**
 * Resizes the terminal dimensions
 * @param {string} sessionId - The terminal session ID
 * @param {number} cols - Number of columns
 * @param {number} rows - Number of rows
 */
export const resizeTerminal = async (sessionId, cols, rows) => {
  if (!sessionId) return;
  
  try {
    await axios.post(`${API_BASE_URL}/terminal/sessions/${sessionId}/resize`, {
      cols, rows
    });
  } catch (error) {
    // Non-critical error, just log
    console.warn('Error resizing terminal:', error.message);
  }
};

// For backward compatibility
export const executeCommand = sendTerminalCommand;
