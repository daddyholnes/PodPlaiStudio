# PodPlay API Studio

A comprehensive locally-hosted interface for interacting with Google's Gemini AI models, inspired by Google AI Studio but with enhanced capabilities and a streamlined UI.

![PodPlay API Studio](generated-icon.png)

## Features

PodPlay API Studio provides a robust interface for interacting with Google's Gemini AI models, offering:

### Multiple Interaction Modes

- **Chat Mode**: Engage in natural conversation with Gemini models
- **Generate Mode**: Create text content based on prompts
- **Code Mode**: Write, explain, and generate code with specialized AI assistance
- **LiveAPI Mode**: Real-time interaction with audio/visual inputs (camera, microphone, screen sharing)

### Advanced Configuration Options

- **Model Selection**: Choose from the complete range of Gemini models (1.0, 1.5, 2.0, 2.5)
- **Parameter Tuning**: Fine-tune temperature, token limits, top-k, top-p values
- **System Instructions**: Provide custom system instructions to guide model behavior
- **Stream Response**: Toggle between streaming and complete responses
- **Safety Settings**: Configure content safety filters (coming soon)

### UI Features

- **Dark/Light Mode**: Switch between dark and light themes
- **Conversation History**: Save, manage, and revisit past conversations
- **API Status Monitoring**: Clear indication of API connectivity
- **Responsive Design**: Optimized for various screen sizes

## Installation

### Prerequisites

- Node.js (v18+)
- npm or yarn
- A Google AI (Gemini) API key - [Get one here](https://ai.google.dev/)

### Setup Instructions

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/podplay-api-studio.git
cd podplay-api-studio
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory and add your Gemini API key:

```
GEMINI_API_KEY=your_api_key_here
```

4. **Start the development server**

```bash
npm run dev
```

5. **Access the application**

Open your browser and navigate to `http://localhost:5000`

## Usage Guide

### Getting Started

1. **Select a Model**: Choose your preferred Gemini model from the dropdown in the sidebar
2. **Choose an Interaction Mode**: Click on one of the vertical tabs (Chat, Generate, Code, LiveAPI)
3. **Configure Parameters**: Adjust model parameters in the right configuration panel
4. **Begin Interacting**: Type your message or prompt in the input area and send

### Chat Mode

- Engage in back-and-forth conversations
- View conversation history on the left sidebar
- Create new conversations with the "+" button
- Rename conversations by clicking on their titles

### Generate Mode

- Create longer-form content based on detailed prompts
- Use for creative writing, summarization, or content generation
- Adjust temperature for more creative or precise outputs

### Code Mode

- Get code suggestions and explanations
- Generate code based on natural language descriptions
- Debug existing code with AI assistance
- Supports multiple programming languages

### LiveAPI Mode

- Connect your camera or microphone for real-time interaction
- Share your screen to discuss visual content
- Process visual and audio data with multimodal AI

## Troubleshooting

### API Key Issues

- Ensure your GEMINI_API_KEY is correctly set in the environment
- Verify the key has sufficient permissions for your selected model
- Check the API status indicator in the application

### Connection Problems

- Look for WebSocket connection errors in the browser console
- Restart the server if you encounter connection timeouts
- Check network connectivity if real-time features aren't working

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

