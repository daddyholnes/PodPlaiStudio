/**
 * API Examples Generator
 * Based on PodPlayStudio LiveApiView component
 */

// Generate API examples for different languages
function generateApiExamples(model, parameters) {
  const apiKey = 'process.env.GEMINI_API_KEY';
  const systemInstruction = parameters.systemInstructions
    ? `\n  systemInstruction: {
    parts: [{ text: "${parameters.systemInstructions.replace(/"/g, '\\"')}" }]
  },` 
    : '';
  
  return {
    node: `// Node.js example using Google AI SDK
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function generateContent() {
  // Initialize the API with your API key
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Get the model
  const model = genAI.getGenerativeModel({ model: '${model}' });
  
  // Generate content
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: 'Write a short poem about artificial intelligence.' }] }],
    generationConfig: {
      temperature: ${parameters.temperature || 0.7},
      topK: ${parameters.topK || 40},
      topP: ${parameters.topP || 0.95},
      maxOutputTokens: ${parameters.maxOutputTokens || 1024},
    }
  });

  const response = result.response;
  console.log(response.text());
}

generateContent();`,

    python: `# Python example using Google AI SDK
import google.generativeai as genai
import os

# Configure the API
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

# Create the model
model = genai.GenerativeModel(
    model_name='${model}',
    generation_config={
        "temperature": ${parameters.temperature || 0.7},
        "top_k": ${parameters.topK || 40},
        "top_p": ${parameters.topP || 0.95},
        "max_output_tokens": ${parameters.maxOutputTokens || 1024}
    }
)

# Generate content
response = model.generate_content("Write a short poem about artificial intelligence.")
print(response.text)`,

    curl: `# cURL example
curl -X POST \\
  'https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}' \\
  -H 'Content-Type: application/json' \\
  -d '{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "Write a short poem about artificial intelligence."
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": ${parameters.temperature || 0.7},
    "topK": ${parameters.topK || 40},
    "topP": ${parameters.topP || 0.95},
    "maxOutputTokens": ${parameters.maxOutputTokens || 1024}
  }${systemInstruction ? `,
  "systemInstruction": {
    "parts": [
      {
        "text": "${parameters.systemInstructions?.replace(/"/g, '\\"')}"
      }
    ]
  }` : ''}
}'`
  };
}

module.exports = {
  generateApiExamples
};
