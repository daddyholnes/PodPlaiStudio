import axios from 'axios';

const API_BASE_URL = '/api/files';

/**
 * Lists all files in the workspace
 * @returns {Promise<Array>} List of files and directories
 */
export const listFiles = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}`);
    return response.data.files;
  } catch (error) {
    console.error('Error listing files:', error);
    throw new Error('Failed to list files');
  }
};

/**
 * Gets the content of a file
 * @param {string} path - File path
 * @returns {Promise<Object>} File content and metadata
 */
export const getFileContent = async (path) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/content`, {
      params: { path }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting file content:', error);
    throw new Error('Failed to get file content');
  }
};

/**
 * Creates a new file
 * @param {string} path - File path
 * @param {string} content - Initial file content
 * @returns {Promise<Object>} Created file details
 */
export const createFile = async (path, content = '') => {
  try {
    const response = await axios.post(`${API_BASE_URL}`, {
      path,
      content
    });
    return response.data;
  } catch (error) {
    console.error('Error creating file:', error);
    throw new Error('Failed to create file');
  }
};

/**
 * Updates file content
 * @param {string} path - File path
 * @param {string} content - New file content
 * @returns {Promise<Object>} Updated file details
 */
export const updateFile = async (path, content) => {
  try {
    const response = await axios.put(`${API_BASE_URL}`, {
      path,
      content
    });
    return response.data;
  } catch (error) {
    console.error('Error updating file:', error);
    throw new Error('Failed to update file');
  }
};

/**
 * Deletes a file
 * @param {string} path - File path
 * @returns {Promise<Object>} Deletion result
 */
export const deleteFile = async (path) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}`, {
      params: { path }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
};

/**
 * Renames a file
 * @param {string} oldPath - Current file path
 * @param {string} newPath - New file path
 * @returns {Promise<Object>} Rename result
 */
export const renameFile = async (oldPath, newPath) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/rename`, {
      oldPath,
      newPath
    });
    return response.data;
  } catch (error) {
    console.error('Error renaming file:', error);
    throw new Error('Failed to rename file');
  }
};
