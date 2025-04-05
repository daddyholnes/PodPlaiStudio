# PodPlay API Studio - Simplified Code Base Overview

This document provides a simplified overview of the PodPlay API Studio codebase, focusing on the most important components and how they work together.

## Core Components

### 1. Server

The server is built with Express.js and provides:
- REST API endpoints for conversations, messages, and file operations
- WebSocket server for real-time communications
- Integration with Gemini AI API
- Simulated terminal functionality

### 2. Client

The client is a React application that includes:
- Chat interface with Gemini AI
- Code generation and editing with Monaco Editor
- Terminal emulation using @xterm/xterm
- LiveKit integration for video/audio chat
- File explorer and management

## Key Files and Their Purpose

### Server Side

- **config.ts** - Environment variables and configuration
- **gemini.ts** - Integration with Google's Gemini AI API
- **routes.ts** - API endpoints and WebSocket handlers
- **terminal.js** - Simulated terminal functionality (replacing node-pty)
- **storage.ts** - In-memory data storage for conversations and messages

### Client Side

- **App.jsx** - Main application component and routing
- **chat-view.tsx** - Chat interface with AI
- **code-view.tsx** - Code generation and editing interface
- **XtermTerminal.jsx** - Terminal emulation using xterm.js
- **VideoChat.jsx** - LiveKit integration for video calls
- **FileTree.jsx** - File explorer and management

## Architectural Changes

We made several architectural changes to improve stability and compatibility:

1. **Terminal Simulation**: Replaced `node-pty` with a simulated terminal approach that doesn't require native modules.

2. **Updated xterm.js**: Migrated from deprecated packages to the newer `@xterm/*` packages:
   - `xterm` → `@xterm/xterm`
   - `xterm-addon-fit` → `@xterm/addon-fit`
   - `xterm-addon-web-links` → `@xterm/addon-web-links`

3. **Clean Installation Script**: Added a cleanup script to fully remove node_modules before reinstallation.

## Installation and Setup

```bash
# Clean installation
npm run clean
npm install

# Development
npm run dev

# Production build
npm run build
```

## Environment Variables

Create a `.env` file with:
```
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
LIVEKIT_SERVER_URL=ws://localhost:7880
GEMINI_API_KEY=your_gemini_api_key_here
```

## Troubleshooting Common Issues

1. **Installation Problems**: Use the clean installation approach above
2. **WebSocket Connection Issues**: Check firewall settings
3. **Missing Environment Variables**: Ensure your `.env` file is correctly configured
4. **Xterm Compatibility**: We now use the latest @xterm/* packages
