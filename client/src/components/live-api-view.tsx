import { useState, useEffect } from 'react';
import CodeBlock from './ui/code-block';
import { useGemini } from '@/hooks/use-gemini';

export default function LiveApiView() {
  const { selectedModel, parameters } = useGemini();
  const [activeExample, setActiveExample] = useState<'node' | 'python' | 'curl'>('node');
  
  // Generate API example based on the current model and parameters
  const getApiExample = (type: 'node' | 'python' | 'curl') => {
    const apiKey = 'process.env.GEMINI_API_KEY';
    const systemInstruction = parameters?.systemInstructions
      ? `\n  systemInstruction: {
    parts: [{ text: "${parameters.systemInstructions.replace(/"/g, '\\"')}" }]
  },` 
      : '';
    
    if (type === 'node') {
      return `// Node.js example using fetch API
const fetch = require('node-fetch');

async function generateContent() {
  const url = 'https://generativelanguage.googleapis.com/v1/models/${selectedModel}:generateContent?key=${apiKey}';
  
  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: 'Write a short poem about artificial intelligence.' }]
      }
    ],
    generationConfig: {
      temperature: ${parameters?.temperature},
      topK: ${parameters?.topK},
      topP: ${parameters?.topP},
      maxOutputTokens: ${parameters?.maxOutputTokens},
    },${systemInstruction}
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

generateContent();`;
    } else if (type === 'python') {
      return `# Python example using requests library
import requests
import json

def generate_content():
    url = f"https://generativelanguage.googleapis.com/v1/models/${selectedModel}:generateContent?key=${apiKey}"
    
    request_body = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": "Write a short poem about artificial intelligence."}]
            }
        ],
        "generationConfig": {
            "temperature": ${parameters?.temperature},
            "topK": ${parameters?.topK},
            "topP": ${parameters?.topP},
            "maxOutputTokens": ${parameters?.maxOutputTokens}
        }${systemInstruction ? `,
        "systemInstruction": {
            "parts": [{"text": "${parameters?.systemInstructions?.replace(/"/g, '\\"')}"}]
        }` : ''}
    }
    
    response = requests.post(url, json=request_body)
    data = response.json()
    print(json.dumps(data, indent=2))

generate_content()`;
    } else { // curl
      return `# cURL example
curl -X POST \\
  'https://generativelanguage.googleapis.com/v1/models/${selectedModel}:generateContent?key=${apiKey}' \\
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
    "temperature": ${parameters?.temperature},
    "topK": ${parameters?.topK},
    "topP": ${parameters?.topP},
    "maxOutputTokens": ${parameters?.maxOutputTokens}
  }${systemInstruction ? `,
  "systemInstruction": {
    "parts": [
      {
        "text": "${parameters?.systemInstructions?.replace(/"/g, '\\"')}"
      }
    ]
  }` : ''}
}'`;
    }
  };
  
  return (
    <div className="flex-grow overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-google-sans font-medium mb-2">PodPlay LiveAPI</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Access Gemini models directly via the API using the configuration settings from this interface.
            Below are code examples to help you get started.
          </p>
        </div>
        
        {/* API Reference */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-300 dark:border-neutral-700 overflow-hidden mb-8">
          <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-3 border-b border-neutral-300 dark:border-neutral-700">
            <h2 className="font-google-sans font-medium">API Reference</h2>
          </div>
          <div className="p-4">
            <h3 className="font-medium mb-2">API Endpoint</h3>
            <CodeBlock 
              language="text" 
              code={`https://generativelanguage.googleapis.com/v1/models/${selectedModel}:generateContent`} 
            />
            
            <h3 className="font-medium mt-4 mb-2">Current Configuration</h3>
            <CodeBlock 
              language="json" 
              code={JSON.stringify({
                model: selectedModel,
                temperature: parameters?.temperature,
                topK: parameters?.topK,
                topP: parameters?.topP,
                maxOutputTokens: parameters?.maxOutputTokens,
                systemInstructions: parameters?.systemInstructions || undefined
              }, null, 2)} 
            />
            
            <div className="mt-4">
              <a 
                href="https://ai.google.dev/api/rest" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-primary hover:underline"
              >
                View full API documentation
              </a>
            </div>
          </div>
        </div>
        
        {/* Code Examples */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-300 dark:border-neutral-700 overflow-hidden">
          <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-3 border-b border-neutral-300 dark:border-neutral-700">
            <h2 className="font-google-sans font-medium">Code Examples</h2>
          </div>
          <div className="border-b border-neutral-300 dark:border-neutral-700">
            <div className="flex">
              <button 
                className={`px-4 py-2 ${activeExample === 'node' ? 'bg-neutral-100 dark:bg-neutral-800 font-medium' : ''}`}
                onClick={() => setActiveExample('node')}
              >
                Node.js
              </button>
              <button 
                className={`px-4 py-2 ${activeExample === 'python' ? 'bg-neutral-100 dark:bg-neutral-800 font-medium' : ''}`}
                onClick={() => setActiveExample('python')}
              >
                Python
              </button>
              <button 
                className={`px-4 py-2 ${activeExample === 'curl' ? 'bg-neutral-100 dark:bg-neutral-800 font-medium' : ''}`}
                onClick={() => setActiveExample('curl')}
              >
                cURL
              </button>
            </div>
          </div>
          <div className="p-4">
            <CodeBlock 
              language={activeExample === 'node' ? 'javascript' : activeExample === 'python' ? 'python' : 'bash'} 
              code={getApiExample(activeExample)} 
            />
          </div>
        </div>
        
        {/* Implementation Notes */}
        <div className="mt-8 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-300 dark:border-neutral-700 overflow-hidden">
          <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-3 border-b border-neutral-300 dark:border-neutral-700">
            <h2 className="font-google-sans font-medium">Implementation Notes</h2>
          </div>
          <div className="p-4">
            <ul className="list-disc pl-5 space-y-2">
              <li className="text-sm">
                Replace <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">process.env.GEMINI_API_KEY</code> with your actual API key.
              </li>
              <li className="text-sm">
                For streaming responses, use the <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">streamGenerateContent</code> endpoint.
              </li>
              <li className="text-sm">
                Make sure to handle API rate limits and errors appropriately in your implementation.
              </li>
              <li className="text-sm">
                For multimodal inputs (like images), you'll need to encode the file as base64 and include it in the request.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
