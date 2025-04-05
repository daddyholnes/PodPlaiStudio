const { contextBridge, ipcRenderer } = require('electron');

// Main application API
contextBridge.exposeInMainWorld('electronAPI', {
  // Model APIs
  queryModel: (prompt, modelConfig) => ipcRenderer.invoke('query-model', { prompt, modelConfig }),
  queryGemini: (prompt) => ipcRenderer.invoke('query-gemini', prompt), // Legacy support
  
  // Settings management
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  
  // Vertex AI verification
  verifyVertexPermissions: (config) => ipcRenderer.invoke('verify-vertex-permissions', config),
  testVertexEndpoint: (config) => ipcRenderer.invoke('test-vertex-endpoint', config),
  
  // Code execution
  executeCode: (code) => ipcRenderer.invoke('execute-code', code),
  
  // gcloud CLI commands
  executeGcloudCommand: (command) => ipcRenderer.invoke('execute-gcloud-command', command),
  
  // Chat history
  loadChatHistory: () => ipcRenderer.invoke('load-chat-history'),
  saveChatHistory: (history) => ipcRenderer.invoke('save-chat-history', history),
  
  // UV integration
  checkUvInstallation: () => ipcRenderer.invoke('check-uv-installation'),
  installUv: () => ipcRenderer.invoke('install-uv'),
  installPackage: (packageName) => ipcRenderer.invoke('install-package', packageName),
  uninstallPackage: (packageName) => ipcRenderer.invoke('uninstall-package', packageName),
  listInstalledPackages: () => ipcRenderer.invoke('list-installed-packages'),
  
  // Genkit integration
  createGenkitProject: (template, path) => ipcRenderer.invoke('create-genkit-project', template, path),
  openGenkitProject: () => ipcRenderer.invoke('open-genkit-project'),
  getRecentGenkitProjects: () => ipcRenderer.invoke('get-recent-genkit-projects'),
  
  // PodPlayStudio integration
  getPodPlayStructure: () => ipcRenderer.invoke('get-podplay-structure'),
  readPodPlayFile: (filePath) => ipcRenderer.invoke('read-podplay-file', filePath),
  
  // Enhanced chat sessions
  saveChatSession: (session) => ipcRenderer.invoke('save-chat-session', session),
  getChatSessions: () => ipcRenderer.invoke('get-chat-sessions'),
  
  // Enhanced Google Cloud integration
  discoverGoogleCloudConfig: () => ipcRenderer.invoke('discover-google-cloud-config'),
  listAvailableVertexModels: (region) => ipcRenderer.invoke('list-available-vertex-models', region),
  getAuthStatus: () => ipcRenderer.invoke('get-auth-status'),
  setupApplicationDefaultCredentials: () => ipcRenderer.invoke('setup-application-default-credentials'),
  
  // Streaming API support
  queryModelStream: (prompt, modelConfig, callbacks) => {
    const channel = `stream-response-${Date.now()}`;
    
    // Set up listeners for streaming response
    ipcRenderer.on(channel, (event, chunk) => {
      if (callbacks.onChunk) callbacks.onChunk(chunk);
    });
    
    ipcRenderer.once(`${channel}-done`, (event, result) => {
      if (callbacks.onComplete) callbacks.onComplete(result);
      // Clean up listener
      ipcRenderer.removeAllListeners(channel);
    });
    
    ipcRenderer.once(`${channel}-error`, (event, error) => {
      if (callbacks.onError) callbacks.onError(error);
      // Clean up listeners
      ipcRenderer.removeAllListeners(channel);
      ipcRenderer.removeAllListeners(`${channel}-done`);
    });
    
    // Start the streaming request
    return ipcRenderer.invoke('query-model-stream', { prompt, modelConfig, responseChannel: channel });
  }
});

// API examples with modern Google Cloud best practices
contextBridge.exposeInMainWorld('apiExamples', {
  // Enhanced API examples with best practices
  generate: (model, parameters, cloudConfig) => {
    try {
      const podPlayIntegration = require('./podplay-integration');
      
      // Use enhanced examples if available
      if (podPlayIntegration.generateEnhancedApiExamples) {
        return podPlayIntegration.generateEnhancedApiExamples(model, parameters, cloudConfig);
      }
      
      // Fall back to regular examples
      const apiExamples = require('./api-examples');
      return apiExamples.generateApiExamples(model, parameters);
    } catch (error) {
      console.error('Error generating API examples:', error);
      
      // Fallback to basic examples if modules not found
      return {
        node: `// Could not load examples: ${error.message}`,
        python: `# Could not load examples: ${error.message}`,
        curl: `# Could not load examples: ${error.message}`
      };
    }
  },
  
  // Specialized examples for model garden
  generateModelGardenExample: (modelType, parameters, cloudConfig) => {
    try {
      const vertexExamples = require('./vertex-model-examples');
      
      switch(modelType) {
        case 'claude':
          return vertexExamples.generateClaudeExample(parameters, cloudConfig);
        case 'llama':
          return vertexExamples.generateLlamaExample(parameters, cloudConfig);
        case 'streaming':
          return vertexExamples.generateStreamingExample(parameters.model || 'gemini-1.5-pro', parameters, cloudConfig);
        default:
          return 'Example not available for this model type';
      }
    } catch (error) {
      console.error('Error generating model garden example:', error);
      return `// Could not load model garden example: ${error.message}`;
    }
  },
  
  // Get Google Cloud configuration
  discoverCloudConfig: async () => {
    try {
      const podPlayIntegration = require('./podplay-integration');
      
      if (podPlayIntegration.discoverGoogleCloudConfig) {
        return podPlayIntegration.discoverGoogleCloudConfig();
      }
      
      // If not available in module, try via IPC
      return await ipcRenderer.invoke('discover-google-cloud-config');
    } catch (error) {
      console.error('Error discovering Google Cloud config:', error);
      return null;
    }
  }
});

// Expose Google Cloud tools for power users
contextBridge.exposeInMainWorld('googleCloud', {
  // Execute raw gcloud commands
  executeCommand: (command) => ipcRenderer.invoke('execute-gcloud-command', command),
  
  // Vertex AI utilities
  listModels: (region) => ipcRenderer.invoke('list-vertex-models', region),
  getModelDetails: (modelId, region) => ipcRenderer.invoke('get-vertex-model-details', modelId, region),
  
  // Authentication utilities
  checkAuthentication: () => ipcRenderer.invoke('check-gcloud-authentication'),
  login: () => ipcRenderer.invoke('gcloud-login'),
  setProject: (projectId) => ipcRenderer.invoke('set-gcloud-project', projectId),
  
  // Quota and usage info
  getQuotaInfo: () => ipcRenderer.invoke('get-quota-info')
});
