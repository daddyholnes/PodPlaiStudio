# PodPlai Studio

An AI Studio with LiveKit integration and sandbox enhancements, featuring real-time video chat, code editing, and terminal functionality.

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

- LiveKit integration for real-time video/audio chat
- Monaco Editor for code editing
- Terminal emulation
- File explorer for project management
- Chat functionality with Gemini AI

## Installation

Before running the project, you'll need to ensure you have Node.js installed (v18 or newer recommended).

```bash
# Clean installation (recommended if you encounter issues)
npm run clean # Removes node_modules folders if script is available
# OR manually remove node_modules folders:
# rm -rf node_modules client/node_modules server/node_modules

# Install dependencies
npm install

# Note: The terminal functionality is now implemented as a pure JavaScript simulation
# without requiring any native dependencies
```

### Prerequisites

- Node.js (v18+)
- npm or yarn
- A Google AI (Gemini) API key - [Get one here](https://ai.google.dev/)

### Setup Instructions

1. **Clone the repository**

```bash
git clone https://github.com/daddyholnes/PodPlaiStudio.git
cd PodPlaiStudio
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory with:

```
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
LIVEKIT_SERVER_URL=ws://localhost:7880
GEMINI_API_KEY=your_gemini_api_key_here
```

4. **Start the development server**

```bash
npm run dev
```

5. **Access the application**

Open your browser and navigate to `http://localhost:5000`

## Development

```bash
# Start both client and server in development mode
npm run dev

# Or start them individually
npm run dev:client
npm run dev:server
```

## Building for Production

```bash
# Build the client
npm run build
```

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

If you encounter installation issues:

1. **Terminal Functionality**: The terminal is implemented in pure JavaScript without native dependencies.

2. **WebSocket Connection Issues**: Check your firewall settings and ensure the WebSocket server can run on the specified port.

3. **Package Conflicts**: Try cleaning node_modules folders before installation.

4. **Missing Environment Variables**: Ensure all environment variables are properly set in your .env file.

5. **Xterm Dependency Warnings**: We've updated to newer @xterm/* packages to resolve deprecation warnings.

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

## Project Structure

```
PodPlaiStudio/
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── contexts/     # React contexts
│   │   ├── hooks/        # Custom hooks
│   │   ├── lib/          # Utility functions
│   │   └── services/     # API service functions
│   └── public/           # Static assets
├── server/               # Express backend
│   ├── src/
│   │   ├── routes/       # API route handlers
│   │   └── services/     # Server-side services
│   └── ...
└── shared/               # Shared types and utilities
```

