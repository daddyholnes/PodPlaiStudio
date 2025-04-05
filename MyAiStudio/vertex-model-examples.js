/**
 * Vertex AI Model Garden Examples
 * 
 * Examples of using various models from the Vertex AI Model Garden
 */

// Example for using Claude models via Vertex AI
function generateClaudeExample(parameters, cloudConfig) {
  const project = cloudConfig?.project || 'YOUR_PROJECT_ID';
  const region = cloudConfig?.regions?.[0] || 'us-central1';
  
  return `// Node.js example for using Claude on Vertex AI
const {VertexAI} = require('@google-cloud/vertexai');

async function generateWithClaude() {
  // Initialize Vertex AI
  const vertexAI = new VertexAI({
    project: '${project}',
    location: '${region}',
  });

  // For Claude, we use the publisher model format
  const generativeModel = vertexAI.preview.getGenerativeModel({
    model: 'claude-3-opus@latest',
    publisher: 'anthropic',
    generationConfig: {
      temperature: ${parameters.temperature || 0.7},
      maxOutputTokens: ${parameters.maxOutputTokens || 1024},
    },
  });

  // Claude uses a specific prompt format
  const prompt = "Human: Write a short poem about artificial intelligence.\n\nAssistant:";
  
  try {
    const response = await generativeModel.generateContent(prompt);
    console.log(response.response.text());
  } catch (error) {
    console.error('Error generating content with Claude:', error);
  }
}

// This requires Application Default Credentials with Vertex AI permissions
generateWithClaude();`;
}

// Example for using Llama models via Vertex AI
function generateLlamaExample(parameters, cloudConfig) {
  const project = cloudConfig?.project || 'YOUR_PROJECT_ID';
  const region = cloudConfig?.regions?.[0] || 'us-central1';
  
  return `// Node.js example for using Llama on Vertex AI
const {VertexAI} = require('@google-cloud/vertexai');

async function generateWithLlama() {
  // Initialize Vertex AI
  const vertexAI = new VertexAI({
    project: '${project}',
    location: '${region}',
  });

  // For Llama, we use the publisher model format
  const generativeModel = vertexAI.preview.getGenerativeModel({
    model: 'llama3',
    publisher: 'meta',
    generationConfig: {
      temperature: ${parameters.temperature || 0.7},
      maxOutputTokens: ${parameters.maxOutputTokens || 1024},
    },
  });

  try {
    const response = await generativeModel.generateContent({
      contents: [{ role: "user", parts: [{ text: "Write a short poem about artificial intelligence." }] }],
    });
    console.log(response.response.text());
  } catch (error) {
    console.error('Error generating content with Llama:', error);
  }
}

// This requires Application Default Credentials with Vertex AI permissions
generateWithLlama();`;
}

// Generate streaming response example
function generateStreamingExample(model, parameters, cloudConfig) {
  const project = cloudConfig?.project || 'YOUR_PROJECT_ID';
  const region = cloudConfig?.regions?.[0] || 'us-central1';
  const isVertexModel = model.startsWith('vertex-');
  const actualModelName = isVertexModel ? model.substring(7) : model;
  
  if (isVertexModel) {
    return `// Node.js streaming example for Vertex AI
const {VertexAI} = require('@google-cloud/vertexai');

async function streamGeneratedContent() {
  // Initialize Vertex AI
  const vertexAI = new VertexAI({
    project: '${project}',
    location: '${region}',
  });

  const generativeModel = vertexAI.preview.getGenerativeModel({
    model: '${actualModelName}',
    generationConfig: {
      temperature: ${parameters.temperature || 0.7},
      maxOutputTokens: ${parameters.maxOutputTokens || 1024},
    },
  });

  const prompt = "Write a detailed story about a robot learning to paint.";
  
  try {
    // Make a streaming request
    const streamingResult = await generativeModel.generateContentStream({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    // Process the streaming response
    for await (const item of streamingResult.stream) {
      const partText = item.candidates[0]?.content?.parts[0]?.text;
      if (partText) {
        process.stdout.write(partText);
      }
    }
    
    console.log("\\nStream complete!");
  } catch (error) {
    console.error('Error streaming content:', error);
  }
}

streamGeneratedContent();`;
  } else {
    return `// Node.js streaming example for Gemini API
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function streamGeneratedContent() {
  // Configure the generative AI
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: '${actualModelName}' });

  const prompt = "Write a detailed story about a robot learning to paint.";
  
  try {
    // Make a streaming request
    const result = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: ${parameters.temperature || 0.7},
        maxOutputTokens: ${parameters.maxOutputTokens || 1024},
      },
    });

    // Process the streaming response
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      process.stdout.write(chunkText);
    }
    
    console.log("\\nStream complete!");
  } catch (error) {
    console.error('Error streaming content:', error);
  }
}

streamGeneratedContent();`;
  }
}

module.exports = {
  generateClaudeExample,
  generateLlamaExample,
  generateStreamingExample
};
