/**
 * PodPlayStudio Integration Module
 * 
 * This module handles the integration of PodPlayStudio design elements
 * and functionality into the main MyAI Studio application.
 */

const fs = require('fs');
const path = require('path');

// Helper function to read and parse PodPlayStudio theme data
function extractPodPlayTheme() {
  try {
    // Try to read theme data from PodPlayStudio folder
    const podPlayPath = path.join(__dirname, 'PodPlayStudio');
    
    // Look for CSS files that might contain theme data
    const cssFiles = fs.readdirSync(podPlayPath)
      .filter(file => file.endsWith('.css') || file.includes('theme') || file.includes('style'));
    
    if (cssFiles.length === 0) {
      console.log('No CSS files found in PodPlayStudio folder');
      return null;
    }
    
    // Read the first CSS file found (most likely to contain theme data)
    const cssFilePath = path.join(podPlayPath, cssFiles[0]);
    const cssContent = fs.readFileSync(cssFilePath, 'utf8');
    
    // Extract color variables and theme properties
    const colorRegex = /--([\w-]+):\s*(#[A-Fa-f0-9]{6}|rgba?\([^)]+\))/g;
    const colors = {};
    let match;
    
    while ((match = colorRegex.exec(cssContent)) !== null) {
      colors[match[1]] = match[2];
    }
    
    return { 
      colors,
      sourceFile: cssFilePath
    };
    
  } catch (error) {
    console.error('Error extracting PodPlayStudio theme:', error);
    return null;
  }
}

// Apply PodPlayStudio theme to current application
function applyPodPlayTheme(theme) {
  if (!theme || !theme.colors || Object.keys(theme.colors).length === 0) {
    console.log('No theme data available to apply');
    return false;
  }
  
  try {
    // Create a style element to inject theme CSS variables
    const styleEl = document.createElement('style');
    
    // Build CSS variables from theme colors
    let cssVars = ':root {\n';
    for (const [name, value] of Object.entries(theme.colors)) {
      cssVars += `  --${name}: ${value};\n`;
    }
    cssVars += '}\n\n';
    
    // Add theme application classes
    cssVars += `.pod-play-theme .sidebar { background-color: var(--sidebar-bg, #2c3e50); }\n`;
    cssVars += `.pod-play-theme .nav-item.active { background-color: var(--active-item-bg, #3498db); }\n`;
    // Add more theme applications based on extracted colors
    
    styleEl.textContent = cssVars;
    document.head.appendChild(styleEl);
    
    // Add theme class to body
    document.body.classList.add('pod-play-theme');
    
    return true;
  } catch (error) {
    console.error('Error applying PodPlayStudio theme:', error);
    return false;
  }
}

// Import UI components from PodPlayStudio
function importPodPlayComponents() {
  try {
    // Look for component templates in PodPlayStudio folder
    const podPlayPath = path.join(__dirname, 'PodPlayStudio');
    const templateFiles = fs.readdirSync(podPlayPath)
      .filter(file => file.endsWith('.html') || file.includes('template'));
    
    const components = {};
    
    for (const file of templateFiles) {
      const filePath = path.join(podPlayPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract component name from filename (remove extension)
      const name = path.basename(file, path.extname(file));
      
      components[name] = {
        content,
        path: filePath
      };
    }
    
    return components;
  } catch (error) {
    console.error('Error importing PodPlayStudio components:', error);
    return {};
  }
}

// Initialize PodPlayStudio integration
function initPodPlayIntegration() {
  console.log('Initializing PodPlayStudio integration...');
  
  // Extract and apply theme
  const theme = extractPodPlayTheme();
  const themeApplied = applyPodPlayTheme(theme);
  
  // Import components
  const components = importPodPlayComponents();
  
  return {
    success: themeApplied || Object.keys(components).length > 0,
    theme,
    components
  };
}

// Add enhanced Google Cloud API integration discovery
function discoverGoogleCloudConfig() {
  try {
    // Check for gcloud CLI configuration
    const { execSync } = require('child_process');
    const gcloudInfo = {};
    
    try {
      // Get current gcloud project
      gcloudInfo.project = execSync('gcloud config get-value project').toString().trim();
      console.log('Detected gcloud project:', gcloudInfo.project);
      
      // Get current account
      gcloudInfo.account = execSync('gcloud config get-value account').toString().trim();
      console.log('Detected gcloud account:', gcloudInfo.account);
      
      // Check if application default credentials are set up
      const homeDir = process.env.HOME || process.env.USERPROFILE;
      const adcPath = path.join(homeDir, '.config', 'gcloud', 'application_default_credentials.json');
      gcloudInfo.hasAdc = fs.existsSync(adcPath);
      console.log('Application Default Credentials available:', gcloudInfo.hasAdc);
      
      // Get available Vertex AI regions
      gcloudInfo.regions = execSync('gcloud ai models list --regions=all --limit=1 --format="value(region)" 2>/dev/null || echo "us-central1"')
        .toString()
        .trim()
        .split('\n')
        .filter(Boolean);
      
      if (!gcloudInfo.regions.length) {
        gcloudInfo.regions = ['us-central1', 'us-east1', 'europe-west4', 'asia-east1'];
      }
      
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
    return null;
  }
}

// Generate better API examples including authentication best practices
function generateEnhancedApiExamples(model, parameters, cloudConfig) {
  try {
    const examples = {};
    const isVertexModel = model.startsWith('vertex-');
    const actualModelName = isVertexModel ? model.substring(7) : model;
    
    // Node.js example with proper authentication
    examples.node = isVertexModel 
      ? generateVertexNodeExample(actualModelName, parameters, cloudConfig)
      : generateGeminiNodeExample(actualModelName, parameters);
      
    // Python example with proper authentication
    examples.python = isVertexModel
      ? generateVertexPythonExample(actualModelName, parameters, cloudConfig)
      : generateGeminiPythonExample(actualModelName, parameters);
    
    // Return the examples
    return examples;
  } catch (error) {
    console.error('Error generating API examples:', error);
    return null;
  }
}

// Generate Node.js example for Vertex AI
function generateVertexNodeExample(model, parameters, cloudConfig) {
  const project = cloudConfig?.project || 'YOUR_PROJECT_ID';
  const region = cloudConfig?.regions?.[0] || 'us-central1';
  
  return `// Node.js example for Vertex AI Gemini API
const {VertexAI} = require('@google-cloud/vertexai');

async function generateContent() {
  // Initialize Vertex with your Google Cloud project and location
  const vertex_ai = new VertexAI({
    project: '${project}', 
    location: '${region}'
  });
  
  // Select the model
  const model = '${model}';
  const generativeModel = vertex_ai.preview.getGenerativeModel({
    model: model,
    generationConfig: {
      temperature: ${parameters.temperature || 0.7},
      topK: ${parameters.topK || 40},
      topP: ${parameters.topP || 0.95},
      maxOutputTokens: ${parameters.maxOutputTokens || 1024},
    },
  });

  const prompt = "Write a short poem about artificial intelligence.";
  
  try {
    // Make the request
    const result = await generativeModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    
    // Handle the response
    const response = result.response;
    console.log(response.text());
  } catch (error) {
    console.error('Error generating content:', error);
  }
}

// This uses Application Default Credentials
// Run this first: gcloud auth application-default login
generateContent();`;
}

// Generate Python example for Vertex AI
function generateVertexPythonExample(model, parameters, cloudConfig) {
  const project = cloudConfig?.project || 'YOUR_PROJECT_ID';
  const region = cloudConfig?.regions?.[0] || 'us-central1';
  
  return `# Python example for Vertex AI Gemini API
import vertexai
from vertexai.generative_models import GenerativeModel, ChatSession
from vertexai.preview.generative_models import GenerationConfig

# Initialize Vertex AI
vertexai.init(project='${project}', location='${region}')

def generate_content():
    # Load the model
    generation_config = GenerationConfig(
        temperature=${parameters.temperature || 0.7},
        top_k=${parameters.topK || 40},
        top_p=${parameters.topP || 0.95},
        max_output_tokens=${parameters.maxOutputTokens || 1024},
    )
    
    model = GenerativeModel(
        model_name='${model}',
        generation_config=generation_config
    )
    
    # Create a chat session
    chat = model.start_chat()
    
    # Send a message
    response = chat.send_message("Write a short poem about artificial intelligence.")
    
    # Print the response
    print(response.text)

# This uses Application Default Credentials
# Run this first: gcloud auth application-default login
generate_content()`;
}

// Generate Node.js example for Gemini API
function generateGeminiNodeExample(model, parameters) {
  return `// Node.js example for Gemini API using Google AI SDK
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function generateContent() {
  // Access your API key as an environment variable (best practice)
  // Alternatively, use a keyring or secret manager in production
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Select the model
  const model = genAI.getGenerativeModel({ model: '${model}' });
  
  // Configure generation parameters
  const generationConfig = {
    temperature: ${parameters.temperature || 0.7},
    topK: ${parameters.topK || 40},
    topP: ${parameters.topP || 0.95},
    maxOutputTokens: ${parameters.maxOutputTokens || 1024},
  };
  
  // Prepare prompt
  const prompt = "Write a short poem about artificial intelligence.";
  
  try {
    // Generate content
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }]}],
      generationConfig,
    });
    
    // Get the response
    const response = result.response;
    console.log(response.text());
  } catch (error) {
    console.error('Error generating content:', error);
  }
}

generateContent();`;
}

// Generate Python example for Gemini API
function generateGeminiPythonExample(model, parameters) {
  return `# Python example for Gemini API using Google AI Python SDK
import google.generativeai as genai
import os

def generate_content():
    # Access your API key as an environment variable (best practice)
    # Alternatively, use a keyring or secret manager in production
    genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
    
    # Set up the model
    generation_config = {
        "temperature": ${parameters.temperature || 0.7},
        "top_k": ${parameters.topK || 40},
        "top_p": ${parameters.topP || 0.95},
        "max_output_tokens": ${parameters.maxOutputTokens || 1024},
    }
    
    model = genai.GenerativeModel(
        model_name='${model}',
        generation_config=generation_config
    )
    
    # Generate content
    response = model.generate_content("Write a short poem about artificial intelligence.")
    
    # Print the response
    print(response.text)

generate_content()`;
}

module.exports = {
  initPodPlayIntegration,
  extractPodPlayTheme,
  applyPodPlayTheme,
  importPodPlayComponents,
  discoverGoogleCloudConfig,
  generateEnhancedApiExamples,
};
