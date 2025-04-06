import axios from 'axios';

const API_BASE_URL = '/api';

// Mock terminal session data for when API calls fail
const createMockSession = () => {
  return {
    id: `mock-${Date.now()}`,
    created: new Date().toISOString(),
    status: 'active'
  };
};

export const createTerminalSession = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/terminal/sessions`);
    return response.data;
  } catch (error) {
    console.warn('Error creating terminal session, using mock session:', error);
    return createMockSession();
  }
};

export const sendTerminalCommand = async (sessionId, command) => {
  try {
    if (!sessionId) {
      throw new Error('No session ID provided');
    }
    
    const response = await axios.post(
      `${API_BASE_URL}/terminal/sessions/${sessionId}/command`, 
      { command }
    );
    return response.data;
  } catch (error) {
    console.warn('Error sending terminal command, using mock response:', error);
    return { output: `Mock output for: ${command}` };
  }
};

export const resizeTerminal = async (sessionId, cols, rows) => {
  try {
    if (!sessionId) return;
    
    await axios.post(
      `${API_BASE_URL}/terminal/sessions/${sessionId}/resize`,
      { cols, rows }
    );
  } catch (error) {
    console.warn('Error resizing terminal:', error);
    // Non-critical error, can be ignored
  }
};

// For backward compatibility
export const executeCommand = sendTerminalCommand;
