// Import dependencies
const marked = require('marked');
const hljs = require('highlight.js');

// Configure marked for code highlighting
marked.setOptions({
  highlight: function(code, language) {
    if (language && hljs.getLanguage(language)) {
      return hljs.highlight(code, { language }).value;
    }
    return hljs.highlightAuto(code).value;
  }
});

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const clearChatButton = document.getElementById('clear-chat');
const codeEditor = document.getElementById('code-editor');
const runCodeButton = document.getElementById('run-code');
const terminalOutput = document.getElementById('terminal-output');
const themeButtons = document.querySelectorAll('.theme-button');
const modelSelector = document.getElementById('model-selector');
const customEndpointContainer = document.getElementById('custom-endpoint-container');
const customEndpoint = document.getElementById('custom-endpoint');
const vertexProject = document.getElementById('vertex-project');
const vertexLocation = document.getElementById('vertex-location');
const saveSettingsButton = document.getElementById('save-settings');
const vertexEndpointId = document.getElementById('vertex-endpoint-id');
const verifyPermissionsButton = document.getElementById('verify-permissions');
const testEndpointButton = document.getElementById('test-endpoint');
const verificationResults = document.getElementById('verification-results');
const verificationStatus = document.querySelector('.verification-status');
const verificationDetails = document.querySelector('.verification-details');

// DOM Elements for Authentication
const authMethodSelector = document.getElementById('auth-method');
const apiKeyFields = document.getElementById('api-key-fields');
const adcFields = document.getElementById('adc-fields');
const serviceAccountFields = document.getElementById('service-account-fields');
const gcloudCliFields = document.getElementById('gcloud-cli-fields');
const geminiApiKeyInput = document.getElementById('gemini-api-key');
const serviceAccountPathInput = document.getElementById('service-account-path');
const gcloudProjectDisplay = document.getElementById('gcloud-project-display');
const gcloudEmailDisplay = document.getElementById('gcloud-email-display');
const refreshGcloudButton = document.getElementById('refresh-gcloud-auth');

// DOM Elements for Build page
const uvCheckInstallButton = document.getElementById('uv-check-install');
const uvStatus = document.getElementById('uv-status');
const uvControls = document.getElementById('uv-controls');
const uvPackageNameInput = document.getElementById('uv-package-name');
const uvInstallPackageButton = document.getElementById('uv-install-package');
const uvInstalledPackages = document.getElementById('uv-installed-packages');

// Genkit elements
const genkitNewBlankButton = document.getElementById('genkit-new-blank');
const genkitNewTemplateButton = document.getElementById('genkit-new-template');
const genkitOpenButton = document.getElementById('genkit-open');
const genkitRecentProjects = document.getElementById('genkit-recent-projects');

// Template modal elements
const templateModal = document.getElementById('template-modal');
const closeTemplateModalButton = document.getElementById('close-template-modal');
const templateCards = document.querySelectorAll('.template-card');

// Chat history
let chatHistory = [];

// App settings
let appSettings = {
  authMethod: 'gcloud-cli', // Default to gcloud CLI since user is already authenticated
  apiKey: '',
  serviceAccountPath: '',
  vertexProjectId: 'camera-calibration-beta', // Set default to current gcloud project
  vertexLocation: 'us-central1',
  vertexEndpointId: '',
  customEndpoint: '',
  gcloudEmail: 'woodyholne@gmail.com'
};

// Navigation - Fix tab switching
function setupNavigation() {
  console.log('Setting up navigation');
  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');
  
  if (navItems.length === 0) {
    console.error('No navigation items found!');
    return;
  }
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      console.log('Nav item clicked:', item.getAttribute('data-page'));
      
      // Remove active class from all nav items
      navItems.forEach(navItem => navItem.classList.remove('active'));
      
      // Add active class to clicked item
      item.classList.add('active');
      
      // Show corresponding page
      const pageId = item.getAttribute('data-page') + '-page';
      console.log('Looking for page:', pageId);
      
      pages.forEach(page => {
        if (page.id === pageId) {
          console.log('Showing page:', page.id);
          page.classList.remove('hidden');
        } else {
          page.classList.add('hidden');
        }
      });
    });
  });
  
  // Set initial active tab if none is active
  if (!document.querySelector('.nav-item.active') && navItems.length > 0) {
    navItems[0].click();
  }
}

// Load chat history from storage
async function loadChatHistory() {
  try {
    chatHistory = await window.electronAPI.loadChatHistory();
    renderChatHistory();
  } catch (error) {
    console.error('Failed to load chat history:', error);
  }
}

// Save chat history to storage
async function saveChatHistory() {
  try {
    await window.electronAPI.saveChatHistory(chatHistory);
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
}

// Render chat history
function renderChatHistory() {
  chatMessages.innerHTML = '';
  
  chatHistory.forEach(message => {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', message.role === 'user' ? 'user-message' : 'ai-message');
    
    if (message.role === 'user') {
      messageElement.textContent = message.content;
    } else {
      // Parse markdown for AI messages
      messageElement.innerHTML = marked.parse(message.content);
    }
    
    chatMessages.appendChild(messageElement);
  });
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send message to AI
async function sendMessage() {
  const message = chatInput.value.trim();
  if (!message) return;
  
  // Add user message to chat
  currentSession.messages.push({ role: 'user', content: message });
  
  // Get current model
  if (modelSelector) {
    currentSession.model = modelSelector.value;
  }
  
  // Clear input
  chatInput.value = '';
  
  // Render chat
  renderChatHistory();
  
  try {
    // Show loading indicator
    const loadingElement = document.createElement('div');
    loadingElement.classList.add('message', 'ai-message');
    loadingElement.textContent = 'Thinking...';
    chatMessages.appendChild(loadingElement);
    
    // Get selected model configuration
    const modelConfig = getModelConfig();
    
    // Query selected model API
    const response = await window.electronAPI.queryModel(message, modelConfig);
    
    // Remove loading indicator
    chatMessages.removeChild(loadingElement);
    
    if (response.error) {
      currentSession.messages.push({ role: 'assistant', content: `Error: ${response.message}` });
    } else {
      let aiResponse = extractResponseFromModelOutput(response, modelConfig);
      currentSession.messages.push({ role: 'assistant', content: aiResponse });
    }
    
    // Save session
    await saveCurrentSession();
    
    // Render updated chat
    renderChatHistory();
  } catch (error) {
    console.error('Error sending message:', error);
    currentSession.messages.push({ 
      role: 'assistant', 
      content: 'Error: Unable to get a response. Please try again.'
    });
    renderChatHistory();
  }
}

// Clear chat history
async function clearChat() {
  if (confirm('Are you sure you want to clear the conversation?')) {
    chatHistory = [];
    await saveChatHistory();
    renderChatHistory();
  }
}

// Run code in sandbox
async function runCode() {
  const code = codeEditor.value.trim();
  if (!code) {
    terminalOutput.textContent = 'Please enter some code to run.';
    return;
  }
  
  terminalOutput.textContent = 'Running code...';
  
  try {
    const result = await window.electronAPI.executeCode(code);
    
    if (result.success) {
      terminalOutput.textContent = result.output || 'Code executed successfully with no output.';
    } else {
      terminalOutput.textContent = 'Error: ' + (result.error || 'Execution failed.');
    }
  } catch (error) {
    console.error('Error executing code:', error);
    terminalOutput.textContent = 'Error: Failed to execute code. Make sure Python is installed on your system.';
  }
}

// Change theme
function changeTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  
  themeButtons.forEach(button => {
    if (button.getAttribute('data-theme') === theme) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
}

// Get the current model configuration - Updated for better gcloud support
function getModelConfig() {
  const selectedModel = modelSelector.value;
  
  // Base configuration
  const config = {
    model: selectedModel,
    authMethod: appSettings.authMethod,
    apiKey: appSettings.apiKey,
    serviceAccountPath: appSettings.serviceAccountPath,
    temperature: 0.7,
    maxTokens: 2048
  };
  
  // Add Vertex AI specific configuration
  if (selectedModel.startsWith('vertex-')) {
    config.projectId = appSettings.vertexProjectId;
    config.location = appSettings.vertexLocation;
    
    // Add gcloud email if using gcloud CLI authentication
    if (appSettings.authMethod === 'gcloud-cli') {
      config.gcloudEmail = appSettings.gcloudEmail;
    }
  } 
  // Add custom endpoint configuration
  else if (selectedModel === 'custom') {
    config.endpoint = appSettings.customEndpoint;
  }
  
  return config;
}

// Load app settings - Updated to check gcloud first
async function loadAppSettings() {
  try {
    const settings = await window.electronAPI.loadSettings();
    appSettings = {...appSettings, ...settings};
    
    // Apply settings to form fields
    if (vertexProject) vertexProject.value = appSettings.vertexProjectId || '';
    if (vertexLocation) vertexLocation.value = appSettings.vertexLocation || 'us-central1';
    if (vertexEndpointId) vertexEndpointId.value = appSettings.vertexEndpointId || '';
    if (customEndpoint) customEndpoint.value = appSettings.customEndpoint || '';
    if (geminiApiKeyInput) geminiApiKeyInput.value = appSettings.apiKey || '';
    if (serviceAccountPathInput) serviceAccountPathInput.value = appSettings.serviceAccountPath || '';
    
    // Set authentication method
    if (authMethodSelector) {
      // Default to gcloud-cli if available since user is already authenticated
      if (appSettings.authMethod === 'api-key' && await fetchGcloudConfig()) {
        appSettings.authMethod = 'gcloud-cli';
      }
      
      authMethodSelector.value = appSettings.authMethod || 'gcloud-cli';
      handleAuthMethodChange();
    }
    
    // Update gcloud displays if available
    if (gcloudProjectDisplay) gcloudProjectDisplay.textContent = appSettings.vertexProjectId;
    if (gcloudEmailDisplay) gcloudEmailDisplay.textContent = appSettings.gcloudEmail;
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

// Save app settings
async function saveAppSettings() {
  try {
    appSettings.vertexProjectId = vertexProject.value;
    appSettings.vertexLocation = vertexLocation.value;
    appSettings.vertexEndpointId = vertexEndpointId.value;
    appSettings.customEndpoint = customEndpoint.value;
    appSettings.apiKey = geminiApiKeyInput ? geminiApiKeyInput.value : '';
    appSettings.serviceAccountPath = serviceAccountPathInput ? serviceAccountPathInput.value : '';
    
    await window.electronAPI.saveSettings(appSettings);
    alert('Settings saved successfully!');
  } catch (error) {
    console.error('Failed to save settings:', error);
    alert('Failed to save settings');
  }
}

// Verify Vertex AI permissions
async function verifyVertexPermissions() {
  if (!appSettings.vertexProjectId) {
    showVerificationResults(false, "Project ID is required for verification");
    return;
  }
  
  showVerificationResults(null, "Verifying IAM permissions...");
  
  try {
    const config = {
      projectId: appSettings.vertexProjectId,
      location: appSettings.vertexLocation,
      authMethod: appSettings.authMethod,
      apiKey: appSettings.apiKey,
      serviceAccountPath: appSettings.serviceAccountPath
    };
    
    const result = await window.electronAPI.verifyVertexPermissions(config);
    
    showVerificationResults(
      result.success, 
      result.message,
      JSON.stringify(result.data, null, 2)
    );
  } catch (error) {
    showVerificationResults(false, `Verification failed: ${error.message}`);
  }
}

// Test Vertex AI endpoint connection
async function testVertexEndpoint() {
  if (!appSettings.vertexProjectId) {
    showVerificationResults(false, "Project ID is required for testing");
    return;
  }
  
  showVerificationResults(null, "Testing endpoint connection...");
  
  try {
    const config = {
      projectId: appSettings.vertexProjectId,
      location: appSettings.vertexLocation,
      authMethod: appSettings.authMethod,
      apiKey: appSettings.apiKey,
      serviceAccountPath: appSettings.serviceAccountPath
    };
    
    const result = await window.electronAPI.testVertexEndpoint(config);
    
    showVerificationResults(
      result.success, 
      result.message,
      JSON.stringify(result.data, null, 2)
    );
  } catch (error) {
    showVerificationResults(false, `Connection test failed: ${error.message}`);
  }
}

// Show verification results
function showVerificationResults(success, message, details = '') {
  verificationResults.classList.remove('hidden', 'success', 'error');
  
  if (success === null) {
    // Loading state
    verificationStatus.textContent = message;
    verificationDetails.textContent = '';
  } else {
    // Success or error state
    verificationResults.classList.add(success ? 'success' : 'error');
    verificationStatus.textContent = message;
    verificationDetails.textContent = details;
  }
}

// Authentication method selection handler - Updated to handle gcloud better
function handleAuthMethodChange() {
  const selectedMethod = authMethodSelector.value;
  
  // Hide all auth method fields
  apiKeyFields.classList.add('hidden');
  adcFields.classList.add('hidden');
  serviceAccountFields.classList.add('hidden');
  if (gcloudCliFields) gcloudCliFields.classList.add('hidden');
  
  // Show selected auth method fields
  switch (selectedMethod) {
    case 'api-key':
      apiKeyFields.classList.remove('hidden');
      break;
    case 'adc':
      adcFields.classList.remove('hidden');
      break;
    case 'service-account':
      serviceAccountFields.classList.remove('hidden');
      break;
    case 'gcloud-cli':
      if (gcloudCliFields) {
        gcloudCliFields.classList.remove('hidden');
        refreshGcloudAuth(); // Automatically check authentication when selected
      }
      break;
  }
  
  // Update app settings
  appSettings.authMethod = selectedMethod;
}

// Add function to fetch current gcloud configuration
async function fetchGcloudConfig() {
  try {
    const result = await window.electronAPI.executeGcloudCommand('config get-value project');
    if (result.success && result.output.trim()) {
      appSettings.vertexProjectId = result.output.trim();
      if (gcloudProjectDisplay) {
        gcloudProjectDisplay.textContent = appSettings.vertexProjectId;
      }
      if (vertexProject) {
        vertexProject.value = appSettings.vertexProjectId;
      }
    }
    
    const accountResult = await window.electronAPI.executeGcloudCommand('config get-value account');
    if (accountResult.success && accountResult.output.trim()) {
      appSettings.gcloudEmail = accountResult.output.trim();
      if (gcloudEmailDisplay) {
        gcloudEmailDisplay.textContent = appSettings.gcloudEmail;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to fetch gcloud config:', error);
    return false;
  }
}

// Refresh gcloud authentication
async function refreshGcloudAuth() {
  try {
    showGcloudStatus('Refreshing gcloud authentication...', 'pending');
    
    const result = await window.electronAPI.executeGcloudCommand('auth print-access-token');
    if (result.success) {
      await fetchGcloudConfig();
      showGcloudStatus('Authentication successful! Token is valid.', 'success');
      return true;
    } else {
      showGcloudStatus('Authentication failed. Please run "gcloud auth login" in terminal.', 'error');
      return false;
    }
  } catch (error) {
    console.error('Failed to refresh gcloud auth:', error);
    showGcloudStatus('Authentication check failed: ' + error.message, 'error');
    return false;
  }
}

// Show gcloud authentication status
function showGcloudStatus(message, status) {
  const statusElement = document.getElementById('gcloud-auth-status');
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.className = 'gcloud-status ' + status;
  }
}

// UV functions
async function checkUvInstallation() {
  uvStatus.textContent = 'Checking UV installation...';
  uvStatus.className = 'gcloud-status pending';
  
  try {
    const result = await window.electronAPI.checkUvInstallation();
    
    if (result.installed) {
      uvStatus.textContent = `UV installed (${result.version})`;
      uvStatus.className = 'gcloud-status success';
      uvControls.classList.remove('hidden');
      
      // Load installed packages
      loadInstalledPackages();
    } else {
      uvStatus.textContent = 'UV not installed. Click to install';
      uvStatus.className = 'gcloud-status error';
      uvControls.classList.add('hidden');
    }
  } catch (error) {
    console.error('Error checking UV:', error);
    uvStatus.textContent = 'Failed to check UV installation';
    uvStatus.className = 'gcloud-status error';
  }
}

async function installUv() {
  uvStatus.textContent = 'Installing UV...';
  uvStatus.className = 'gcloud-status pending';
  
  try {
    const result = await window.electronAPI.installUv();
    
    if (result.success) {
      uvStatus.textContent = 'UV installed successfully';
      uvStatus.className = 'gcloud-status success';
      uvControls.classList.remove('hidden');
      
      // Load installed packages
      loadInstalledPackages();
    } else {
      uvStatus.textContent = 'Failed to install UV';
      uvStatus.className = 'gcloud-status error';
      console.error('UV installation output:', result.output);
    }
  } catch (error) {
    console.error('Error installing UV:', error);
    uvStatus.textContent = 'Error installing UV';
    uvStatus.className = 'gcloud-status error';
  }
}

async function loadInstalledPackages() {
  try {
    const result = await window.electronAPI.listInstalledPackages();
    
    if (result.success) {
      uvInstalledPackages.innerHTML = '';
      
      if (result.packages.length === 0) {
        uvInstalledPackages.innerHTML = '<div class="uv-package">No packages installed</div>';
        return;
      }
      
      result.packages.forEach(pkg => {
        const packageElement = document.createElement('div');
        packageElement.className = 'uv-package';
        packageElement.innerHTML = `
          <span class="uv-package-name">${pkg.name}</span>
          <span class="uv-package-version">${pkg.version}</span>
          <button class="uv-package-remove" data-package="${pkg.name}">Remove</button>
        `;
        uvInstalledPackages.appendChild(packageElement);
      });
      
      // Add event listeners to remove buttons
      document.querySelectorAll('.uv-package-remove').forEach(button => {
        button.addEventListener('click', async () => {
          const packageName = button.getAttribute('data-package');
          await uninstallPackage(packageName);
        });
      });
    } else {
      console.error('Failed to list packages:', result.error);
    }
  } catch (error) {
    console.error('Error listing packages:', error);
  }
}

async function installPackage(packageName) {
  if (!packageName) return;
  
  try {
    const result = await window.electronAPI.installPackage(packageName);
    
    if (result.success) {
      uvPackageNameInput.value = '';
      loadInstalledPackages();
    } else {
      console.error('Failed to install package:', result.output);
      alert(`Failed to install package: ${packageName}`);
    }
  } catch (error) {
    console.error('Error installing package:', error);
    alert(`Error installing package: ${error.message}`);
  }
}

async function uninstallPackage(packageName) {
  try {
    const result = await window.electronAPI.uninstallPackage(packageName);
    
    if (result.success) {
      loadInstalledPackages();
    } else {
      console.error('Failed to uninstall package:', result.output);
      alert(`Failed to uninstall package: ${packageName}`);
    }
  } catch (error) {
    console.error('Error uninstalling package:', error);
    alert(`Error uninstalling package: ${error.message}`);
  }
}

// Genkit functions
async function loadRecentProjects() {
  try {
    const projects = await window.electronAPI.getRecentGenkitProjects();
    
    genkitRecentProjects.innerHTML = '';
    
    if (projects.length === 0) {
      genkitRecentProjects.innerHTML = '<p>No recent projects</p>';
      return;
    }
    
    const projectsList = document.createElement('div');
    projectsList.className = 'genkit-recent-list';
    
    projects.forEach(project => {
      const projectItem = document.createElement('div');
      projectItem.className = 'genkit-recent-item';
      projectItem.innerHTML = `
        <div class="genkit-recent-name">${project.name}</div>
        <div class="genkit-recent-path">${project.path}</div>
        <div class="genkit-recent-date">${new Date(project.created || project.opened).toLocaleDateString()}</div>
      `;
      projectsList.appendChild(projectItem);
      
      // Add click event to open project
      projectItem.addEventListener('click', () => {
        // Open project in VS Code or system file explorer
        window.electronAPI.openGenkitProject(project.path);
      });
    });
    
    genkitRecentProjects.appendChild(projectsList);
  } catch (error) {
    console.error('Error loading recent projects:', error);
    genkitRecentProjects.innerHTML = '<p>Failed to load recent projects</p>';
  }
}

async function createBlankProject() {
  try {
    const result = await window.electronAPI.createGenkitProject();
    
    if (result.success) {
      loadRecentProjects();
      alert(`Project created successfully at: ${result.path}`);
    } else {
      console.error('Failed to create project:', result.error);
      alert(`Failed to create project: ${result.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error creating project:', error);
    alert(`Error creating project: ${error.message}`);
  }
}

function openTemplateModal() {
  templateModal.classList.remove('hidden');
}

function closeTemplateModal() {
  templateModal.classList.add('hidden');
}

async function createProjectFromTemplate(template) {
  try {
    closeTemplateModal();
    
    const result = await window.electronAPI.createGenkitProject(template);
    
    if (result.success) {
      loadRecentProjects();
      alert(`Project created successfully at: ${result.path}`);
    } else {
      console.error('Failed to create project:', result.error);
      alert(`Failed to create project: ${result.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error creating project from template:', error);
    alert(`Error creating project: ${error.message}`);
  }
}

async function openExistingProject() {
  try {
    const result = await window.electronAPI.openGenkitProject();
    
    if (result.success) {
      loadRecentProjects();
    } else if (result.error) {
      console.error('Failed to open project:', result.error);
      alert(`Failed to open project: ${result.error}`);
    }
  } catch (error) {
    console.error('Error opening project:', error);
    alert(`Error opening project: ${error.message}`);
  }
}

// Add event listeners for Build page elements
function setupBuildPageListeners() {
  if (uvCheckInstallButton) {
    uvCheckInstallButton.addEventListener('click', async () => {
      const result = await window.electronAPI.checkUvInstallation();
      if (!result.installed) {
        if (confirm('UV is not installed. Would you like to install it now?')) {
          installUv();
        }
      } else {
        checkUvInstallation();
      }
    });
  }
  
  if (uvInstallPackageButton) {
    uvInstallPackageButton.addEventListener('click', () => {
      const packageName = uvPackageNameInput.value.trim();
      if (packageName) {
        installPackage(packageName);
      }
    });
  }
  
  if (uvPackageNameInput) {
    uvPackageNameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const packageName = uvPackageNameInput.value.trim();
        if (packageName) {
          installPackage(packageName);
        }
      }
    });
  }
  
  if (genkitNewBlankButton) {
    genkitNewBlankButton.addEventListener('click', createBlankProject);
  }
  
  if (genkitNewTemplateButton) {
    genkitNewTemplateButton.addEventListener('click', openTemplateModal);
  }
  
  if (genkitOpenButton) {
    genkitOpenButton.addEventListener('click', openExistingProject);
  }
  
  if (closeTemplateModalButton) {
    closeTemplateModalButton.addEventListener('click', closeTemplateModal);
  }
  
  if (templateCards) {
    templateCards.forEach(card => {
      card.addEventListener('click', () => {
        const template = card.getAttribute('data-template');
        createProjectFromTemplate(template);
      });
    });
  }
  
  // Close modal if clicking outside content
  if (templateModal) {
    templateModal.addEventListener('click', (e) => {
      if (e.target === templateModal) {
        closeTemplateModal();
      }
    });
  }
}

// Model selector change handler
modelSelector.addEventListener('change', () => {
  if (modelSelector.value === 'custom') {
    customEndpointContainer.classList.remove('hidden');
  } else {
    customEndpointContainer.classList.add('hidden');
  }
});

// Initialize app - Make sure DOM is fully loaded before attaching events
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM fully loaded');
  
  // Setup navigation first
  setupNavigation();
  
  // Then load other functionality
  loadChatHistory();
  loadAppSettings();
  
  // Check if API key is available
  window.electronAPI.queryGemini("check api key").then(response => {
    if (response.error) {
      // Display a notification about missing API key only if it's related to the key
      if (response.message.includes("API key not found")) {
        const notification = document.createElement('div');
        notification.classList.add('api-key-notification');
        notification.innerHTML = `
          <p>${response.message}</p>
          <p>You need to set the GEMINI_API_KEY in your Windows environment variables.</p>
        `;
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
          notification.style.opacity = "0";
          setTimeout(() => notification.remove(), 1000);
        }, 10000);
      }
    }
  }).catch(err => {
    console.error("Failed to check API key:", err);
  });
  
  // Double check event listeners for all interactive elements
  if (sendButton) {
    console.log('Adding event listener to send button');
    sendButton.addEventListener('click', sendMessage);
  } else {
    console.error('Send button not found');
  }
  
  if (chatInput) {
    console.log('Adding event listener to chat input');
    chatInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  } else {
    console.error('Chat input not found');
  }
  
  if (clearChatButton) {
    console.log('Adding event listener to clear chat button');
    clearChatButton.addEventListener('click', clearChat);
  } else {
    console.error('Clear chat button not found');
  }
  
  if (runCodeButton) {
    console.log('Adding event listener to run code button');
    runCodeButton.addEventListener('click', runCode);
  } else {
    console.error('Run code button not found');
  }
  
  if (modelSelector) {
    console.log('Adding event listener to model selector');
    modelSelector.addEventListener('change', () => {
      if (modelSelector.value === 'custom') {
        customEndpointContainer.classList.remove('hidden');
      } else {
        customEndpointContainer.classList.add('hidden');
      }
    });
  } else {
    console.error('Model selector not found');
  }
  
  if (saveSettingsButton) {
    console.log('Adding event listener to save settings button');
    saveSettingsButton.addEventListener('click', saveAppSettings);
  } else {
    console.error('Save settings button not found');
  }
  
  if (verifyPermissionsButton) {
    console.log('Adding event listener to verify permissions button');
    verifyPermissionsButton.addEventListener('click', verifyVertexPermissions);
  } else {
    console.error('Verify permissions button not found');
  }
  
  if (testEndpointButton) {
    console.log('Adding event listener to test endpoint button');
    testEndpointButton.addEventListener('click', testVertexEndpoint);
  } else {
    console.error('Test endpoint button not found');
  }
  
  // Initialize verification result area
  if (verificationResults) {
    verificationResults.classList.add('hidden');
  }
  
  // Output debug info about UI elements
  console.log('UI elements found:', {
    navItems: document.querySelectorAll('.nav-item').length,
    pages: document.querySelectorAll('.page').length,
    chatMessages: !!chatMessages,
    chatInput: !!chatInput,
    sendButton: !!sendButton,
    clearChatButton: !!clearChatButton,
    codeEditor: !!codeEditor,
    runCodeButton: !!runCodeButton,
    terminalOutput: !!terminalOutput,
    modelSelector: !!modelSelector,
    customEndpointContainer: !!customEndpointContainer,
    saveSettingsButton: !!saveSettingsButton
  });
  
  // Initialize proper UI state for authentication method
  if (authMethodSelector) {
    handleAuthMethodChange();
  }
  
  if (authMethodSelector) {
    console.log('Adding event listener to auth method selector');
    authMethodSelector.addEventListener('change', handleAuthMethodChange);
  } else {
    console.error('Auth method selector not found');
  }
  
  // Setup Build page functionality
  setupBuildPageListeners();
  
  // Check UV installation status on load
  if (uvStatus) {
    checkUvInstallation();
  }
  
  // Load recent Genkit projects
  if (genkitRecentProjects) {
    loadRecentProjects();
  }
  
  // Initialize PodPlayStudio integration
  const podPlayIntegrated = await initPodPlayIntegration();
  console.log('PodPlayStudio integration status:', podPlayIntegrated);
  
  // Load chat sessions
  const sessions = await loadChatSessions();
  
  // If there are existing sessions, populate session history
  if (sessions.length > 0 && document.getElementById('chat-sessions')) {
    const chatSessionsEl = document.getElementById('chat-sessions');
    chatSessionsEl.innerHTML = '';
    
    sessions.forEach(session => {
      const sessionEl = document.createElement('div');
      sessionEl.className = 'history-item';
      sessionEl.textContent = session.title;
      sessionEl.dataset.sessionId = session.id;
      
      sessionEl.addEventListener('click', () => {
        loadChatSession(session.id);
      });
      
      chatSessionsEl.appendChild(sessionEl);
    });
  }
  
  // Set up LiveAPI tabs
  setupLiveApiTabs();
  
  // Update API examples when model changes
  if (modelSelector) {
    modelSelector.addEventListener('change', updateApiExamples);
  }
});

// Add PodPlayStudio integration functions
let podPlayTheme = null;
let podPlayComponents = {};

async function initPodPlayIntegration() {
  try {
    // Get PodPlayStudio structure
    const structureResult = await window.electronAPI.getPodPlayStructure();
    
    if (!structureResult.success) {
      console.warn('Failed to get PodPlayStudio structure:', structureResult.message);
      return false;
    }
    
    // Extract CSS files for theme
    const cssFiles = findFilesByExtension(structureResult.structure, '.css');
    
    if (cssFiles.length > 0) {
      // Read first CSS file
      const cssResult = await window.electronAPI.readPodPlayFile(cssFiles[0].path);
      
      if (cssResult.success) {
        podPlayTheme = extractThemeFromCSS(cssResult.content);
        applyPodPlayTheme(podPlayTheme);
      }
    }
    
    // Extract HTML templates
    const htmlFiles = findFilesByExtension(structureResult.structure, '.html');
    
    for (const htmlFile of htmlFiles) {
      const result = await window.electronAPI.readPodPlayFile(htmlFile.path);
      
      if (result.success) {
        const componentName = path.basename(htmlFile.name, '.html');
        podPlayComponents[componentName] = result.content;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing PodPlayStudio integration:', error);
    return false;
  }
}

// Helper function to find files by extension
function findFilesByExtension(structure, extension) {
  const files = [];
  
  function search(items) {
    for (const item of items) {
      if (item.type === 'file' && item.extension === extension) {
        files.push(item);
      } else if (item.type === 'directory' && item.children) {
        search(item.children);
      }
    }
  }
  
  search(structure);
  return files;
}

// Extract theme from CSS content
function extractThemeFromCSS(css) {
  const theme = {
    colors: {},
    fonts: {},
    spacing: {}
  };
  
  // Extract CSS variables
  const variableRegex = /--([^:]+):\s*([^;]+);/g;
  let match;
  
  while ((match = variableRegex.exec(css)) !== null) {
    const name = match[1].trim();
    const value = match[2].trim();
    
    // Categorize variables
    if (value.startsWith('#') || value.startsWith('rgb')) {
      theme.colors[name] = value;
    } else if (value.includes('font') || value.includes('em') || value.includes('px') && name.includes('font')) {
      theme.fonts[name] = value;
    } else if (value.includes('px') || value.includes('em') || value.includes('rem')) {
      theme.spacing[name] = value;
    }
  }
  
  return theme;
}

// Apply theme to current application
function applyPodPlayTheme(theme) {
  if (!theme || !theme.colors) {
    console.warn('No valid theme to apply');
    return false;
  }
  
  const style = document.createElement('style');
  style.id = 'podplay-theme';
  
  let css = ':root {\n';
  
  // Add color variables
  for (const [name, value] of Object.entries(theme.colors)) {
    css += `  --${name}: ${value};\n`
  }
  
  // Add font variables
  for (const [name, value] of Object.entries(theme.fonts)) {
    css += `  --${name}: ${value};\n`
  }
  
  // Add spacing variables
  for (const [name, value] of Object.entries(theme.spacing)) {
    css += `  --${name}: ${value};\n`
  }
  
  css += '}\n';
  
  style.textContent = css;
  document.head.appendChild(style);
  
  // Add theme class to body
  document.body.classList.add('podplay-theme');
  
  return true;
}

// Chat sessions management
let currentSession = {
  id: Date.now().toString(),
  title: 'New Conversation',
  messages: [],
  model: null
};

async function saveCurrentSession() {
  try {
    // Only save if there are messages
    if (currentSession.messages.length === 0) {
      return;
    }
    
    // Generate title from first message if not set
    if (currentSession.title === 'New Conversation' && currentSession.messages.length > 0) {
      const firstUserMessage = currentSession.messages.find(m => m.role === 'user');
      
      if (firstUserMessage) {
        // Use first ~30 chars of first user message as title
        currentSession.title = firstUserMessage.content.substring(0, 30) + 
          (firstUserMessage.content.length > 30 ? '...' : '');
      }
    }
    
    const result = await window.electronAPI.saveChatSession(currentSession);
    
    if (!result.success) {
      console.error('Failed to save chat session:', result.message);
    }
    
    return result.success;
  } catch (error) {
    console.error('Error saving chat session:', error);
    return false;
  }
}

async function loadChatSessions() {
  try {
    const result = await window.electronAPI.getChatSessions();
    
    if (!result.success) {
      console.error('Failed to load chat sessions:', result.message);
      return [];
    }
    
    return result.sessions || [];
  } catch (error) {
    console.error('Error loading chat sessions:', error);
    return [];
  }
}

async function loadChatSession(sessionId) {
  try {
    const sessions = await loadChatSessions();
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
      console.error('Chat session not found:', sessionId);
      return false;
    }
    
    // Save current session before switching
    await saveCurrentSession();
    
    // Set new current session
    currentSession = session;
    
    // Update UI with session data
    renderChatHistory();
    
    // Update model selector if applicable
    if (session.model && modelSelector) {
      modelSelector.value = session.model;
    }
    
    return true;
  } catch (error) {
    console.error('Error loading chat session:', error);
    return false;
  }
}

// Extract response from model output based on model type
function extractResponseFromModelOutput(response, modelConfig) {
  if (response.error) {
    return `Error: ${response.message}`;
  }
  
  if (modelConfig.model.startsWith('vertex-')) {
    // Handle Vertex AI models response structure
    if (modelConfig.model.includes('gemini')) {
      // Gemini models on Vertex AI
      return response.data.predictions[0].content || 
             response.data.predictions[0].candidates[0].content || 
             JSON.stringify(response.data);
    } else if (modelConfig.model.includes('claude')) {
      // Claude models on Vertex AI
      return response.data.predictions[0].content || 
             response.data.predictions[0].completion || 
             JSON.stringify(response.data);
    } else {
      // Generic handling for other Vertex AI models
      return response.data.predictions[0].content || 
             response.data.predictions[0].text || 
             JSON.stringify(response.data);
    }
  } else {
    // Standard Gemini response handling
    return response.data.candidates[0].content.parts[0].text;
  }
}

// Updated render chat history for sessions
function renderChatHistory() {
  if (!chatMessages) return;
  
  chatMessages.innerHTML = '';
  
  currentSession.messages.forEach(message => {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', message.role === 'user' ? 'user-message' : 'ai-message');
    
    if (message.role === 'user') {
      messageElement.textContent = message.content;
    } else {
      // Parse markdown for AI messages
      messageElement.innerHTML = marked.parse(message.content);
    }
    
    chatMessages.appendChild(messageElement);
  });
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// LiveAPI functionality
const apiExamples = require('./api-examples');
const nodeTab = document.getElementById('node-tab');
const pythonTab = document.getElementById('python-tab');
const curlTab = document.getElementById('curl-tab');
const codeExampleDisplay = document.getElementById('code-example-display');
const apiEndpointDisplay = document.getElementById('api-endpoint-display');
const configDisplay = document.getElementById('config-display');

// Current example type
let currentExampleType = 'node';

// Function to update code examples
function updateApiExamples() {
  if (!codeExampleDisplay) return;
  
  const selectedModel = modelSelector ? modelSelector.value : 'gemini-1.5-pro';
  
  // Get current parameters from app settings
  const parameters = {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024,
    systemInstructions: ''
  };
  
  // Generate examples
  const examples = apiExamples.generateApiExamples(selectedModel, parameters);
  
  // Update code display
  codeExampleDisplay.innerHTML = `<pre><code class="${
    currentExampleType === 'node' ? 'javascript' : 
    currentExampleType === 'python' ? 'python' : 'bash'
  }">${examples[currentExampleType]}</code></pre>`;
  
  // Apply syntax highlighting
  if (window.hljs) {
    document.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });
  }
  
  // Update API endpoint display
  if (apiEndpointDisplay) {
    apiEndpointDisplay.innerHTML = `<pre><code class="language-text">https://generativelanguage.googleapis.com/v1/models/${selectedModel}:generateContent</code></pre>`;
  }
  
  // Update configuration display
  if (configDisplay) {
    const config = {
      model: selectedModel,
      temperature: parameters.temperature,
      topK: parameters.topK,
      topP: parameters.topP,
      maxOutputTokens: parameters.maxOutputTokens,
      systemInstructions: parameters.systemInstructions || undefined
    };
    
    configDisplay.innerHTML = `<pre><code class="language-json">${JSON.stringify(config, null, 2)}</code></pre>`;
  }
}

// Set up LiveAPI tabs
function setupLiveApiTabs() {
  if (!nodeTab || !pythonTab || !curlTab) return;
  
  const tabs = [nodeTab, pythonTab, curlTab];
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Update current example type
      if (tab === nodeTab) currentExampleType = 'node';
      else if (tab === pythonTab) currentExampleType = 'python';
      else if (tab === curlTab) currentExampleType = 'curl';
      
      // Update code examples
      updateApiExamples();
    });
  });
  
  // Initialize with first tab active
  updateApiExamples();
}

// Add LiveAPI initialization to DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // ...existing code...
  
  // Set up LiveAPI tabs
  setupLiveApiTabs();
  
  // Update API examples when model changes
  if (modelSelector) {
    modelSelector.addEventListener('change', updateApiExamples);
  }
  
  // ...existing code...
});
