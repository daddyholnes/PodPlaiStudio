/**
 * Enhanced Google Cloud Integration for MyAI Studio
 * 
 * This module provides updated handlers for Google Cloud operations,
 * including Vertex AI, Gemini API, and gcloud CLI integration.
 */

const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Check if required libraries are installed
let googleAI = null;
let vertexAI = null;

try {
  googleAI = require('@google/generative-ai');
  console.log('Google Generative AI SDK loaded successfully');
} catch (error) {
  console.warn('Google Generative AI SDK not found. Run "npm install @google/generative-ai" to enable Gemini API access.');
}

try {
  vertexAI = require('@google-cloud/vertexai');
  console.log('Vertex AI SDK loaded successfully');
} catch (error) {
  console.warn('Vertex AI SDK not found. Run "npm install @google-cloud/vertexai" to enable Vertex AI access.');
}

// Discover Google Cloud configuration
function discoverGoogleCloudConfig() {
  try {
    const gcloudInfo = {};
    
    try {
      // Get current gcloud project
      gcloudInfo.project = execSync('gcloud config get-value project').toString().trim();
      console.log('Detected gcloud project:', gcloudInfo.project);
      
      // Get current account
      gcloudInfo.account = execSync('gcloud config get-value account').toString().trim();
      console.log('Detected gcloud account:', gcloudInfo.account);
      
      // Check if application default credentials are set up
      const homeDir = os.homedir();
      const adcPath = path.join(homeDir, '.config', 'gcloud', 'application_default_credentials.json');
      gcloudInfo.hasAdc = fs.existsSync(adcPath);
      console.log('Application Default Credentials available:', gcloudInfo.hasAdc);
      
      // Get available Vertex AI regions
      try {
        gcloudInfo.regions = execSync('gcloud ai models list --regions=all --limit=1 --format="value(region)" 2>/dev/null || echo "us-central1"')
          .toString()
          .trim()
          .split('\n')
          .filter(Boolean);
      } catch (e) {
        // Default regions if command fails
        gcloudInfo.regions = ['us-central1', 'us-east1', 'europe-west4', 'asia-east1'];
      }
      
      // Set availability flag
      gcloudInfo.available = true;
      
      return gcloudInfo;
    } catch (cliError) {
      console.warn('gcloud CLI error:', cliError.message);
      return { 
        available: false, 
        error: cliError.message,
        project: null,
        account: null,
        hasAdc: false,
        regions: ['us-central1']
      };
    }
  } catch (error) {
    console.error('Error discovering Google Cloud config:', error);
    return {
      available: false,
      error: error.message
    };
  }
}

// Query model with streaming support
async function queryModelWithStreaming(prompt, modelConfig, responseChannel, event) {
  try {
    const isVertexModel = modelConfig.model.startsWith('vertex-');
    const actualModelName = isVertexModel ? modelConfig.model.substring(7) : modelConfig.model;
    
    if (isVertexModel) {
      if (!vertexAI) {
        throw new Error('Vertex AI SDK not installed. Run "npm install @google-cloud/vertexai" first.');
      }
      
      // Stream using Vertex AI
      await streamWithVertexAI(prompt, actualModelName, modelConfig, responseChannel, event);
    } else {
      if (!googleAI) {
        throw new Error('Google Generative AI SDK not installed. Run "npm install @google/generative-ai" first.');
      }
      
      // Stream using Gemini API
      await streamWithGeminiAPI(prompt, actualModelName, modelConfig, responseChannel, event);
    }
    
    // Signal completion
    event.sender.send(`${responseChannel}-done`, { success: true });
  } catch (error) {
    console.error('Error streaming from model:', error);
    event.sender.send(`${responseChannel}-error`, { 
      error: true, 
      message: error.message 
    });
  }
}

// Stream with Vertex AI
async function streamWithVertexAI(prompt, modelName, modelConfig, responseChannel, event) {
  try {
    const projectId = modelConfig.projectId;
    const location = modelConfig.location || 'us-central1';
    
    if (!projectId) {
      throw new Error('Project ID is required for Vertex AI models');
    }
    
    // Initialize Vertex AI
    const { VertexAI } = vertexAI;
    const vertexAiClient = new VertexAI({
      project: projectId,
      location: location,
    });
    
    // Determine if this is a publisher model (like Claude or Llama)
    const modelParts = modelName.split('-');
    let publisher = 'google';
    let model = modelName;
    
    if (modelName.includes('claude')) {
      publisher = 'anthropic';
      model = `claude-${modelParts.slice(-2).join('-')}`;
    } else if (modelName.includes('llama')) {
      publisher = 'meta';
      model = modelParts[0]; // e.g., llama3
    }
    
    // Get the model
    const generativeModel = vertexAiClient.preview.getGenerativeModel({
      model: model,
      publisher: publisher,
      generationConfig: {
        temperature: modelConfig.temperature || 0.7,
        topK: modelConfig.topK || 40,
        topP: modelConfig.topP || 0.95,
        maxOutputTokens: modelConfig.maxTokens || 1024,
      },
    });
    
    // Start streaming
    const requestData = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    };
    
    // Handle Claude's specific format if needed
    if (publisher === 'anthropic') {
      requestData.contents[0].parts[0].text = `Human: ${prompt}\n\nAssistant:`;
    }
    
    const streamingResult = await generativeModel.generateContentStream(requestData);
    
    // Process the streaming response
    for await (const chunk of streamingResult.stream) {
      const chunkText = chunk.candidates[0]?.content?.parts[0]?.text || '';
      
      if (chunkText) {
        event.sender.send(responseChannel, {
          text: chunkText,
          done: false
        });
      }
    }
  } catch (error) {
    throw error;
  }
}

// Stream with Gemini API
async function streamWithGeminiAPI(prompt, modelName, modelConfig, responseChannel, event) {
  try {
    // Get API key
    const apiKey = modelConfig.apiKey || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('API key not found. Please set GEMINI_API_KEY in your environment variables.');
    }
    
    // Initialize the Google Generative AI
    const { GoogleGenerativeAI } = googleAI;
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Get the model
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: modelConfig.temperature || 0.7,
        topK: modelConfig.topK || 40,
        topP: modelConfig.topP || 0.95,
        maxOutputTokens: modelConfig.maxTokens || 1024,
      },
    });
    
    // Start streaming
    const result = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    
    // Process the streaming response
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      
      if (chunkText) {
        event.sender.send(responseChannel, {
          text: chunkText,
          done: false
        });
      }
    }
  } catch (error) {
    throw error;
  }
}

// List available Vertex AI models
async function listVertexAIModels(region = 'us-central1') {
  return new Promise((resolve, reject) => {
    exec(`gcloud ai models list --region=${region} --format=json`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to list Vertex AI models: ${error.message}`);
        reject(error);
        return;
      }
      
      try {
        const models = JSON.parse(stdout);
        resolve(models);
      } catch (parseError) {
        console.error(`Failed to parse Vertex AI models: ${parseError.message}`);
        reject(parseError);
      }
    });
  });
}

// Set up Application Default Credentials
function setupADC() {
  return new Promise((resolve, reject) => {
    exec('gcloud auth application-default login', (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to set up ADC: ${error.message}`);
        reject(error);
        return;
      }
      
      resolve({
        success: true,
        message: 'Application Default Credentials set up successfully'
      });
    });
  });
}

// Check gcloud authentication status
function checkGcloudAuthentication() {
  return new Promise((resolve) => {
    exec('gcloud auth list --format=json', (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to check gcloud auth: ${error.message}`);
        resolve({
          authenticated: false,
          error: error.message
        });
        return;
      }
      
      try {
        const accounts = JSON.parse(stdout);
        resolve({
          authenticated: accounts.length > 0,
          accounts: accounts,
          activeAccount: accounts.find(a => a.status === 'ACTIVE')
        });
      } catch (parseError) {
        console.error(`Failed to parse auth list: ${parseError.message}`);
        resolve({
          authenticated: false,
          error: parseError.message
        });
      }
    });
  });
}

// Get quota information
function getQuotaInfo() {
  return new Promise((resolve) => {
    exec('gcloud compute project-info describe --format=json', (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to get quota info: ${error.message}`);
        resolve({
          success: false,
          error: error.message
        });
        return;
      }
      
      try {
        const projectInfo = JSON.parse(stdout);
        const quotas = projectInfo.quotas || [];
        
        // Extract relevant AI quotas
        const aiQuotas = quotas.filter(q => 
          q.metric.includes('AI') || 
          q.metric.includes('gpu') || 
          q.metric.includes('TPU')
        );
        
        resolve({
          success: true,
          quotas: aiQuotas,
          fullQuotas: quotas
        });
      } catch (parseError) {
        console.error(`Failed to parse quota info: ${parseError.message}`);
        resolve({
          success: false,
          error: parseError.message
        });
      }
    });
  });
}

module.exports = {
  discoverGoogleCloudConfig,
  queryModelWithStreaming,
  listVertexAIModels,
  setupADC,
  checkGcloudAuthentication,
  getQuotaInfo
};
