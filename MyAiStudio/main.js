const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');

// Try to load googleapis but don't fail if it's not installed
let google;
try {
  google = require('googleapis').google;
  console.log('Google APIs library loaded successfully');
} catch (error) {
  console.warn('Google APIs library not found. Advanced authentication features will be limited.');
  google = null;
}

// Load from .env only if environment variable isn't already set
if (!process.env.GEMINI_API_KEY) {
  require('dotenv').config();
}

const Store = require('electron-store');
const store = new Store();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  // Check if Google Sans font exists in local assets
  const fontDir = path.join(__dirname, 'assets', 'fonts');
  const googleSansPath = path.join(fontDir, 'GoogleSans-Regular.ttf');
  
  // Create font directory if it doesn't exist
  if (!fs.existsSync(fontDir)) {
    try {
      fs.mkdirSync(fontDir, { recursive: true });
      console.log('Created fonts directory');
    } catch (err) {
      console.error('Failed to create fonts directory:', err);
    }
  }
  
  // Copy PodPlayStudio fonts if available
  const podPlayFontsDir = path.join(__dirname, 'PodPlayStudio', 'client', 'public', 'fonts');
  if (fs.existsSync(podPlayFontsDir)) {
    try {
      const fonts = fs.readdirSync(podPlayFontsDir);
      fonts.forEach(font => {
        const sourcePath = path.join(podPlayFontsDir, font);
        const destPath = path.join(fontDir, font);
        
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(sourcePath, destPath);
          console.log(`Copied font: ${font}`);
        }
      });
    } catch (err) {
      console.error('Failed to copy PodPlayStudio fonts:', err);
    }
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handler to toggle DevTools
ipcMain.on('toggle-dev-tools', () => {
  if (mainWindow) {
    mainWindow.webContents.toggleDevTools();
  }
});

// Get authentication token based on auth method
async function getAuthToken(authConfig) {
  try {
    const { authMethod, projectId } = authConfig;
    
    switch(authMethod) {
      case 'api-key':
        // API key is used directly in requests, not as a token
        return { apiKey: authConfig.apiKey || process.env.GEMINI_API_KEY };
        
      case 'adc':
        // Use Application Default Credentials
        if (!google) {
          throw new Error('Google APIs library not installed. Run "npm install googleapis" to enable ADC authentication.');
        }
        
        const auth = new google.auth.GoogleAuth({
          scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
        const client = await auth.getClient();
        const token = await client.getAccessToken();
        return { token: token.token };
        
      case 'service-account':
        // Use a service account key file
        if (!google) {
          throw new Error('Google APIs library not installed. Run "npm install googleapis" to enable service account authentication.');
        }
        
        if (!authConfig.serviceAccountPath) {
          throw new Error('Service account key file path not provided');
        }
        
        const keyFile = JSON.parse(fs.readFileSync(authConfig.serviceAccountPath, 'utf8'));
        const serviceAuth = new google.auth.GoogleAuth({
          credentials: keyFile,
          scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
        const serviceClient = await serviceAuth.getClient();
        const serviceToken = await serviceClient.getAccessToken();
        return { token: serviceToken.token };
        
      case 'gcloud-cli':
        // Use the gcloud CLI to get a token
        return new Promise((resolve, reject) => {
          exec('gcloud auth print-access-token', (error, stdout, stderr) => {
            if (error) {
              reject(new Error(`Failed to get token from gcloud CLI: ${error.message}`));
              return;
            }
            if (stderr) {
              console.warn('gcloud CLI warning:', stderr);
            }
            resolve({ token: stdout.trim() });
          });
        });
        
      default:
        throw new Error(`Unsupported authentication method: ${authMethod}`);
    }
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

// IPC handler for querying models
ipcMain.handle('query-model', async (event, { prompt, modelConfig }) => {
  try {
    const { authMethod, apiKey, serviceAccountPath } = modelConfig;
    
    // Build authentication config
    const authConfig = {
      authMethod: authMethod || 'api-key', 
      apiKey: apiKey || process.env.GEMINI_API_KEY,
      serviceAccountPath,
      projectId: modelConfig.projectId
    };
    
    // Get authentication token or API key
    const auth = await getAuthToken(authConfig);
    
    // Handle different model types based on the model name prefix
    if (modelConfig.model.startsWith('vertex-')) {
      return await handleVertexModel(prompt, modelConfig, auth);
    } else {
      return await handleGeminiModel(prompt, modelConfig, auth);
    }
  } catch (error) {
    return {
      error: true,
      message: `Error querying model: ${error.message}`
    };
  }
});

// Handle Gemini API models (direct API key usage)
async function handleGeminiModel(prompt, modelConfig, auth) {
  if (!auth.apiKey) {
    return {
      error: true,
      message: "API key not found. Please set GEMINI_API_KEY in your environment variables or provide it in settings."
    };
  }
  
  // Extract the actual model name without any prefix
  const modelName = modelConfig.model;
  
  try {
    // Standard Gemini API with API key
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${auth.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: modelConfig.temperature || 0.7,
          topK: modelConfig.topK || 40,
          topP: modelConfig.topP || 0.95,
          maxOutputTokens: modelConfig.maxTokens || 2048,
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API request failed');
    }
    
    const data = await response.json();
    return {
      error: false,
      data: data
    };
  } catch (error) {
    return {
      error: true,
      message: error.message
    };
  }
}

// Handle Vertex AI models
async function handleVertexModel(prompt, modelConfig, auth) {
  const projectId = modelConfig.projectId;
  if (!projectId) {
    return {
      error: true,
      message: "Project ID is required for Vertex AI models."
    };
  }
  
  // Parse the model name to extract the actual model ID
  const modelNameParts = modelConfig.model.split('-');
  modelNameParts.shift(); // Remove "vertex-" prefix
  
  // Determine publisher and model based on name
  let publisher = 'google';
  let modelId = modelNameParts.join('-');
  
  // Handle special cases
  if (modelId.startsWith('claude')) {
    publisher = 'anthropic';
  } else if (modelId.startsWith('llama')) {
    publisher = 'meta';
  }
  
  try {
    const location = modelConfig.location || 'us-central1';
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/${publisher}/models/${modelId}:predict`;
    
    // Determine the appropriate request payload format based on the model
    let requestBody;
    
    if (publisher === 'google' && modelId.startsWith('gemini')) {
      // Gemini models on Vertex AI
      requestBody = {
        instances: [
          {
            prompt: prompt
          }
        ],
        parameters: {
          temperature: modelConfig.temperature || 0.7,
          maxOutputTokens: modelConfig.maxTokens || 2048,
          topK: modelConfig.topK || 40,
          topP: modelConfig.topP || 0.95
        }
      };
    } else if (publisher === 'anthropic') {
      // Claude models
      requestBody = {
        instances: [
          {
            prompt: `Human: ${prompt}\n\nAssistant:`,
            max_tokens: modelConfig.maxTokens || 2048,
            temperature: modelConfig.temperature || 0.7
          }
        ]
      };
    } else {
      // Generic format for other models
      requestBody = {
        instances: [
          {
            prompt: prompt
          }
        ],
        parameters: {
          temperature: modelConfig.temperature || 0.7,
          maxOutputTokens: modelConfig.maxTokens || 2048
        }
      };
    }
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Use token for authentication with Vertex AI
    if (auth.token) {
      headers['Authorization'] = `Bearer ${auth.token}`;
    } else if (auth.apiKey) {
      // For API key authentication (not typically used with Vertex AI)
      headers['x-goog-api-key'] = auth.apiKey;
    } else {
      throw new Error('No authentication method provided for Vertex AI');
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Vertex AI request failed');
    }
    
    const data = await response.json();
    return {
      error: false,
      data: data,
      modelType: 'vertex'
    };
  } catch (error) {
    return {
      error: true,
      message: `Vertex AI error: ${error.message}`
    };
  }
}

// IPC handler for verifying Vertex AI permissions
ipcMain.handle('verify-vertex-permissions', async (event, config) => {
  try {
    const { projectId, location, authMethod, serviceAccountPath } = config;
    
    if (!projectId) {
      return {
        success: false,
        message: "Project ID is required for Vertex AI verification."
      };
    }
    
    // Build authentication config
    const authConfig = {
      authMethod: authMethod || 'api-key',
      apiKey: config.apiKey || process.env.GEMINI_API_KEY,
      serviceAccountPath,
      projectId
    };
    
    // Get authentication token
    const auth = await getAuthToken(authConfig);
    
    // Construct the URL for testing permissions
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}:testIamPermissions`;
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Use the appropriate authentication method
    if (auth.token) {
      headers['Authorization'] = `Bearer ${auth.token}`;
    } else if (auth.apiKey) {
      headers['x-goog-api-key'] = auth.apiKey;
    } else {
      throw new Error('No authentication method provided');
    }
    
    // Required permissions for Vertex AI
    const permissions = [
      "aiplatform.models.get",
      "aiplatform.models.predict"
    ];
    
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        permissions: permissions
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to verify permissions');
    }
    
    const data = await response.json();
    
    // Check which permissions were returned
    const grantedPermissions = data.permissions || [];
    const missingPermissions = permissions.filter(p => !grantedPermissions.includes(p));
    
    return {
      success: missingPermissions.length === 0,
      data: data,
      grantedPermissions,
      missingPermissions,
      message: missingPermissions.length === 0 
        ? "All required permissions are available" 
        : `Missing permissions: ${missingPermissions.join(', ')}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Verification failed: ${error.message}`
    };
  }
});

// IPC handler for testing Vertex AI endpoint connection
ipcMain.handle('test-vertex-endpoint', async (event, config) => {
  try {
    const { projectId, location, authMethod, serviceAccountPath } = config;
    
    if (!projectId) {
      return {
        success: false,
        message: "Project ID is required for Vertex AI testing."
      };
    }
    
    // Build authentication config
    const authConfig = {
      authMethod: authMethod || 'api-key',
      apiKey: config.apiKey || process.env.GEMINI_API_KEY,
      serviceAccountPath,
      projectId
    };
    
    // Get authentication token
    const auth = await getAuthToken(authConfig);
    
    // Use a simple test prompt
    const testPrompt = "Hello, this is a test message. Please respond with a short confirmation.";
    
    // Vertex AI endpoint for Gemini 1.5 Pro
    const modelId = 'gemini-1.5-pro';
    const publisher = 'google';
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/${publisher}/models/${modelId}:predict`;
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Use the appropriate authentication method
    if (auth.token) {
      headers['Authorization'] = `Bearer ${auth.token}`;
    } else if (auth.apiKey) {
      headers['x-goog-api-key'] = auth.apiKey;
    } else {
      throw new Error('No authentication method provided');
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        instances: [
          {
            prompt: testPrompt
          }
        ],
        parameters: {
          temperature: 0.2,
          maxOutputTokens: 256
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API request failed');
    }
    
    const data = await response.json();
    
    return {
      success: true,
      message: "Successfully connected to Vertex AI endpoint",
      data: data
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection test failed: ${error.message}`
    };
  }
});

// Store settings
ipcMain.handle('save-settings', (event, settings) => {
  store.set('aiStudioSettings', settings);
  return true;
});

ipcMain.handle('load-settings', (event) => {
  return store.get('aiStudioSettings', {
    authMethod: 'api-key',
    vertexProjectId: '',
    vertexLocation: 'us-central1',
    serviceAccountPath: ''
  });
});

// IPC handler for executing code in sandbox
ipcMain.handle('execute-code', async (event, code) => {
  console.log('Received code execution request:', code.substring(0, 50) + '...');
  
  // Create a temporary Python file
  const tempFile = path.join(app.getPath('temp'), 'ai_studio_code.py');
  fs.writeFileSync(tempFile, code);
  
  console.log('Temporary Python file created at:', tempFile);
  
  return new Promise((resolve) => {
    let output = '';
    let errorOutput = '';
    
    // Use 'python' or 'python3' depending on your system
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    console.log('Using Python command:', pythonCommand);
    
    const pythonProcess = spawn(pythonCommand, [tempFile]);
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      console.log('Python process closed with code:', code);
      
      // Clean up the temp file
      try {
        fs.unlinkSync(tempFile);
      } catch (err) {
        console.error('Failed to delete temp file:', err);
      }
      
      resolve({
        success: code === 0,
        output: output,
        error: errorOutput
      });
    });
    
    pythonProcess.on('error', (err) => {
      console.error('Failed to start Python process:', err);
      resolve({
        success: false,
        output: '',
        error: `Failed to start Python process: ${err.message}. Make sure Python is installed.`
      });
    });
  });
});

// Execute gcloud command helper
ipcMain.handle('execute-gcloud-command', async (event, command) => {
  return new Promise((resolve) => {
    const fullCommand = `gcloud ${command}`;
    console.log('Executing gcloud command:', fullCommand);
    
    exec(fullCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing gcloud command: ${error}`);
        resolve({
          success: false,
          output: '',
          error: error.message
        });
        return;
      }
      
      resolve({
        success: true,
        output: stdout.trim(),
        error: stderr
      });
    });
  });
});

// Backward compatibility - keep the old queryGemini handler
ipcMain.handle('query-gemini', async (event, prompt) => {
  const modelConfig = { 
    model: 'gemini-1.5-pro',
    authMethod: 'api-key'
  };
  
  return await handleGeminiModel(prompt, modelConfig, { 
    apiKey: process.env.GEMINI_API_KEY 
  });
});

// Import necessary modules for file operations
const { dialog } = require('electron');
const { existsSync, mkdirSync } = require('fs');
const { join } = require('path');

// UV and Genkit integration handlers

// Check if UV is installed
ipcMain.handle('check-uv-installation', async () => {
  return new Promise((resolve) => {
    exec('uv --version', (error, stdout, stderr) => {
      if (error) {
        resolve({ installed: false, version: null });
        return;
      }
      resolve({ installed: true, version: stdout.trim() });
    });
  });
});

// Install UV
ipcMain.handle('install-uv', async () => {
  return new Promise((resolve) => {
    exec('curl -LsSf https://astral.sh/uv/install.sh | sh', (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, output: stderr });
        return;
      }
      resolve({ success: true, output: stdout });
    });
  });
});

// Install package with UV
ipcMain.handle('install-package', async (event, packageName) => {
  return new Promise((resolve) => {
    exec(`uv pip install ${packageName}`, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, output: stderr });
        return;
      }
      resolve({ success: true, output: stdout });
    });
  });
});

// Uninstall package with UV
ipcMain.handle('uninstall-package', async (event, packageName) => {
  return new Promise((resolve) => {
    exec(`uv pip uninstall -y ${packageName}`, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, output: stderr });
        return;
      }
      resolve({ success: true, output: stdout });
    });
  });
});

// List installed packages
ipcMain.handle('list-installed-packages', async () => {
  return new Promise((resolve) => {
    exec('uv pip list --format=json', (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, packages: [] });
        return;
      }
      try {
        const packages = JSON.parse(stdout);
        resolve({ success: true, packages });
      } catch (parseError) {
        resolve({ success: false, packages: [], error: 'Failed to parse package list' });
      }
    });
  });
});

// Genkit project handlers
const projectsDir = join(app.getPath('userData'), 'genkit-projects');

// Ensure projects directory exists
if (!existsSync(projectsDir)) {
  mkdirSync(projectsDir, { recursive: true });
}

// Get recent Genkit projects
ipcMain.handle('get-recent-genkit-projects', () => {
  const settings = store.get('genkitProjects', []);
  return settings;
});

// Create new Genkit project
ipcMain.handle('create-genkit-project', async (event, template, projectPath = null) => {
  try {
    // If no path provided, ask user to select directory
    if (!projectPath) {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory', 'createDirectory']
      });
      
      if (result.canceled) {
        return { success: false, reason: 'Operation canceled' };
      }
      
      projectPath = result.filePaths[0];
    }
    
    // Default to blank template
    let command = 'npm init -y && npm install genkit';
    
    // Use appropriate command based on template
    if (template) {
      if (template === 'chatbot') {
        command = 'npx create-genkit-app@latest chatbot-app --example chat';
      } else if (template === 'ai-barista') {
        command = 'npx create-genkit-app@latest ai-barista --example ai-barista';
      } else if (template === 'rag') {
        command = 'npx create-genkit-app@latest rag-app --example rag';
      } else if (template === 'restaurant-menu') {
        command = 'npx create-genkit-app@latest menu-qa --example restaurant-menu';
      } else if (template === 'school-agent') {
        command = 'npx create-genkit-app@latest school-agent --example js-schoolAgent';
      }
    }
    
    // Execute the command in the selected directory
    return new Promise((resolve) => {
      exec(command, { cwd: projectPath }, (error, stdout, stderr) => {
        if (error) {
          console.error('Error creating project:', error);
          resolve({ success: false, error: stderr });
          return;
        }
        
        // Save to recent projects
        const recentProjects = store.get('genkitProjects', []);
        const projectInfo = {
          path: projectPath,
          name: template || 'blank-project',
          created: new Date().toISOString()
        };
        
        // Add to the beginning, avoid duplicates
        const updatedProjects = [
          projectInfo,
          ...recentProjects.filter(p => p.path !== projectPath)
        ].slice(0, 5); // Keep only 5 most recent
        
        store.set('genkitProjects', updatedProjects);
        
        resolve({ 
          success: true, 
          path: projectPath,
          output: stdout 
        });
      });
    });
  } catch (error) {
    console.error('Project creation error:', error);
    return { success: false, error: error.message };
  }
});

// Open existing Genkit project
ipcMain.handle('open-genkit-project', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    
    if (result.canceled) {
      return { success: false, reason: 'Operation canceled' };
    }
    
    const projectPath = result.filePaths[0];
    
    // Check if it's a valid npm/Node.js project (has package.json)
    if (!existsSync(join(projectPath, 'package.json'))) {
      return { 
        success: false, 
        error: 'Selected directory does not appear to be a valid Node.js project. Missing package.json.'
      };
    }
    
    // Save to recent projects
    const recentProjects = store.get('genkitProjects', []);
    const projectInfo = {
      path: projectPath,
      name: path.basename(projectPath),
      opened: new Date().toISOString()
    };
    
    // Add to the beginning, avoid duplicates
    const updatedProjects = [
      projectInfo,
      ...recentProjects.filter(p => p.path !== projectPath)
    ].slice(0, 5); // Keep only 5 most recent
    
    store.set('genkitProjects', updatedProjects);
    
    return { success: true, path: projectPath };
  } catch (error) {
    console.error('Project open error:', error);
    return { success: false, error: error.message };
  }
});

// Import PodPlayStudio integration module
try {
  const podPlayIntegration = require('./podplay-integration');
  console.log('PodPlayStudio integration module loaded');
} catch (error) {
  console.warn('PodPlayStudio integration module not loaded:', error.message);
}

// Add a handler to get file structure of PodPlayStudio
ipcMain.handle('get-podplay-structure', async () => {
  try {
    const podPlayPath = path.join(__dirname, 'PodPlayStudio');
    
    if (!fs.existsSync(podPlayPath)) {
      return { success: false, message: 'PodPlayStudio folder not found' };
    }
    
    // Get all files and their types
    const getFilesRecursively = (dir) => {
      const files = [];
      
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          files.push({
            name: item,
            path: fullPath,
            type: 'directory',
            children: getFilesRecursively(fullPath)
          });
        } else {
          files.push({
            name: item,
            path: fullPath,
            type: 'file',
            extension: path.extname(item)
          });
        }
      }
      
      return files;
    };
    
    const structure = getFilesRecursively(podPlayPath);
    
    return {
      success: true,
      structure
    };
  } catch (error) {
    console.error('Error getting PodPlayStudio structure:', error);
    return {
      success: false,
      message: error.message
    };
  }
});

// Add handler to read file content from PodPlayStudio
ipcMain.handle('read-podplay-file', async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, message: 'File not found' };
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    return {
      success: true,
      content
    };
  } catch (error) {
    console.error('Error reading PodPlayStudio file:', error);
    return {
      success: false,
      message: error.message
    };
  }
});

// Add handler for unified chat history
ipcMain.handle('save-chat-session', async (event, session) => {
  try {
    const sessions = store.get('chatSessions', []);
    
    // Check if session already exists
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    
    if (existingIndex >= 0) {
      // Update existing session
      sessions[existingIndex] = {
        ...sessions[existingIndex],
        ...session,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new session
      sessions.unshift({
        ...session,
        id: session.id || Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    // Keep only the most recent 50 sessions
    const updatedSessions = sessions.slice(0, 50);
    
    store.set('chatSessions', updatedSessions);
    
    return { success: true };
  } catch (error) {
    console.error('Error saving chat session:', error);
    return {
      success: false,
      message: error.message
    };
  }
});

ipcMain.handle('get-chat-sessions', async () => {
  try {
    const sessions = store.get('chatSessions', []);
    return { success: true, sessions };
  } catch (error) {
    console.error('Error getting chat sessions:', error);
    return {
      success: false,
      message: error.message
    };
  }
});

// Add these imports and handlers to your main.js file

// Import the cloud integration module
let cloudIntegration;
try {
  cloudIntegration = require('./cloud-integration');
  console.log('Cloud integration module loaded successfully');
} catch (error) {
  console.warn('Cloud integration module not loaded:', error.message);
}

// Enhanced Google Cloud handlers
ipcMain.handle('discover-google-cloud-config', async () => {
  if (cloudIntegration?.discoverGoogleCloudConfig) {
    return cloudIntegration.discoverGoogleCloudConfig();
  }
  
  return {
    available: false,
    error: 'Cloud integration module not available'
  };
});

ipcMain.handle('list-available-vertex-models', async (event, region) => {
  if (cloudIntegration?.listVertexAIModels) {
    try {
      return await cloudIntegration.listVertexAIModels(region);
    } catch (error) {
      return { error: true, message: error.message };
    }
  }
  
  return { error: true, message: 'Cloud integration module not available' };
});

ipcMain.handle('setup-application-default-credentials', async () => {
  if (cloudIntegration?.setupADC) {
    try {
      return await cloudIntegration.setupADC();
    } catch (error) {
      return { error: true, message: error.message };
    }
  }
  
  return { error: true, message: 'Cloud integration module not available' };
});

ipcMain.handle('get-auth-status', async () => {
  if (cloudIntegration?.checkGcloudAuthentication) {
    try {
      return await cloudIntegration.checkGcloudAuthentication();
    } catch (error) {
      return { error: true, message: error.message };
    }
  }
  
  return { error: true, message: 'Cloud integration module not available' };
});

// Streaming API handler
ipcMain.handle('query-model-stream', async (event, { prompt, modelConfig, responseChannel }) => {
  if (cloudIntegration?.queryModelWithStreaming) {
    try {
      // This function will send chunks via the specified channel
      cloudIntegration.queryModelWithStreaming(prompt, modelConfig, responseChannel, event);
      return { started: true };
    } catch (error) {
      return { error: true, message: error.message };
    }
  }
  
  return { error: true, message: 'Cloud integration module not available' };
});

// Add more Google Cloud utilities
ipcMain.handle('list-vertex-models', async (event, region) => {
  if (cloudIntegration?.listVertexAIModels) {
    try {
      return await cloudIntegration.listVertexAIModels(region);
    } catch (error) {
      return { error: true, message: error.message };
    }
  }
  
  return { error: true, message: 'Cloud integration module not available' };
});

ipcMain.handle('check-gcloud-authentication', async () => {
  if (cloudIntegration?.checkGcloudAuthentication) {
    try {
      return await cloudIntegration.checkGcloudAuthentication();
    } catch (error) {
      return { error: true, message: error.message };
    }
  }
  
  return { error: true, message: 'Cloud integration module not available' };
});

ipcMain.handle('get-quota-info', async () => {
  if (cloudIntegration?.getQuotaInfo) {
    try {
      return await cloudIntegration.getQuotaInfo();
    } catch (error) {
      return { error: true, message: error.message };
    }
  }
  
  return { error: true, message: 'Cloud integration module not available' };
});

// Add handler for gcloud login
ipcMain.handle('gcloud-login', async () => {
  return new Promise((resolve) => {
    exec('gcloud auth login', (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to login: ${error.message}`);
        resolve({ success: false, error: error.message });
        return;
      }
      
      resolve({ success: true, message: 'Authentication successful' });
    });
  });
});

// Add handler for setting gcloud project
ipcMain.handle('set-gcloud-project', async (event, projectId) => {
  if (!projectId) {
    return { success: false, error: 'Project ID is required' };
  }
  
  return new Promise((resolve) => {
    exec(`gcloud config set project ${projectId}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to set project: ${error.message}`);
        resolve({ success: false, error: error.message });
        return;
      }
      
      resolve({ success: true, message: `Project set to ${projectId}` });
    });
  });
});
